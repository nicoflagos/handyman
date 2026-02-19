import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { OrderService } from '../services/order.service';
import { UserService } from '../services/user.service';
import { OrderStatus } from '../models/mongo/order.schema';

type AuthRequest = Request & { userId?: string };

export class OrdersController {
  constructor(private orderService: OrderService, private userService: UserService) {}

  private toSafeOrder(order: any, opts: { includeVerificationCode: boolean }) {
    const plain = order?.toObject ? order.toObject() : order;
    if (!opts.includeVerificationCode) delete plain.verificationCode;
    return plain;
  }

  private async withPartyInfo(order: any, viewer: { role: 'customer' | 'provider' | 'admin'; userId: string }) {
    const plain = order?.toObject ? order.toObject() : order;
    if (!plain?.providerId) return plain;
    if (plain.status === 'requested') return plain;

    const isCustomer = String(plain.customerId) === viewer.userId;
    const isHandyman = String(plain.providerId) === viewer.userId;
    const isAdmin = viewer.role === 'admin';
    if (!(isAdmin || isCustomer || isHandyman)) return plain;

    const customer = await this.userService.getPublicProfile(new Types.ObjectId(String(plain.customerId)));
    const handyman = await this.userService.getPublicProfile(new Types.ObjectId(String(plain.providerId)));
    plain.customerInfo = customer;
    plain.handymanInfo = handyman;
    return plain;
  }

  async listMyOrders(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const userObjectId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(userObjectId);
      const orders = await this.orderService.listForUser({ userId: userObjectId, role });
      const safe = orders.map(o => this.toSafeOrder(o, { includeVerificationCode: false }));
      return res.status(200).json(safe);
    } catch (error) {
      return res.status(500).json({ message: 'Error listing orders', error });
    }
  }

  async listMarketplace(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const providerId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(providerId);
      if (role !== 'provider' && role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      const provider = await this.userService.getProviderProfile(providerId);
      const profile = provider?.providerProfile;
      if (!profile?.available) return res.status(200).json([]);
      if (!profile?.country || !profile?.state || !profile?.lga) {
        return res.status(400).json({ message: 'Set your handyman Country, State, and LGA before browsing the marketplace' });
      }
      if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
        return res.status(400).json({ message: 'Select at least one skill before browsing the marketplace' });
      }

      const orders = await this.orderService.listMarketplace({
        limit: 50,
        country: profile.country,
        state: profile.state,
        lga: profile.lga,
        serviceKeys: profile.skills,
      });
      return res.status(200).json(orders);
    } catch (error) {
      return res.status(500).json({ message: 'Error listing marketplace orders', error });
    }
  }

  async createOrder(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const role = await this.userService.getRole(new Types.ObjectId(req.userId));
      if (role !== 'customer') return res.status(403).json({ message: 'Only customers can create orders' });
      const { serviceKey, title, description, address, scheduledAt, country, state, lga } = req.body || {};
      if (!serviceKey || !title || !country || !state || !lga) {
        return res.status(400).json({ message: 'serviceKey, title, country, state, and lga are required' });
      }

      const customerId = new Types.ObjectId(req.userId);
      const order = await this.orderService.createOrder({
        customerId,
        serviceKey,
        title,
        description,
        address,
        country,
        state,
        lga,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      });
      return res.status(201).json(this.toSafeOrder(order, { includeVerificationCode: true }));
    } catch (error) {
      return res.status(500).json({ message: 'Error creating order', error });
    }
  }

  async getOrder(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const orderId = req.params.id;
      const order = await this.orderService.getById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      const viewerId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(viewerId);
      const isCustomer = order.customerId?.toString() === req.userId;
      const isProvider = order.providerId?.toString() === req.userId;
      const includeVerificationCode = role === 'admin' || isCustomer;
      if (!(role === 'admin' || isCustomer || isProvider)) {
        // Allow providers to view *unassigned* requested orders that match their profile,
        // so they can review details before accepting.
        if (role === 'provider' && order.status === 'requested' && !order.providerId) {
          const provider = await this.userService.getProviderProfile(viewerId);
          const profile = provider?.providerProfile;
          const matches =
            !!profile?.available &&
            !!profile?.country &&
            !!profile?.state &&
            !!profile?.lga &&
            profile.country === (order as any).country &&
            profile.state === (order as any).state &&
            profile.lga === (order as any).lga &&
            Array.isArray(profile.skills) &&
            profile.skills.includes(order.serviceKey);

          if (matches) {
            return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: false }));
          }
        }

        return res.status(403).json({ message: 'Forbidden' });
      }

      const safe = this.toSafeOrder(order, { includeVerificationCode });
      const enriched = await this.withPartyInfo(safe, { role, userId: req.userId });
      return res.status(200).json(enriched);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving order', error });
    }
  }

  async acceptOrder(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const role = await this.userService.getRole(new Types.ObjectId(req.userId));
      if (role !== 'provider' && role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      const order = await this.orderService.acceptOrder({
        orderId: req.params.id,
        providerId: new Types.ObjectId(req.userId),
      });
      if (!order) return res.status(404).json({ message: 'Order not found' });
      return res.status(200).json(order);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || 'Unable to accept order' });
    }
  }

  async setStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const { status, note, verificationCode } = req.body || {};
      if (!status) return res.status(400).json({ message: 'status is required' });

      const order = await this.orderService.getById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      const actorId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(actorId);
      const isCustomer = order.customerId?.toString() === req.userId;
      const isProvider = order.providerId?.toString() === req.userId;

      const nextStatus = status as OrderStatus;

      const providerAllowed: OrderStatus[] = ['in_progress', 'completed'];
      const customerAllowed: OrderStatus[] = ['canceled'];
      const adminAllowed: OrderStatus[] = ['requested', 'accepted', 'in_progress', 'completed', 'canceled'];

      const allowed =
        role === 'admin'
          ? adminAllowed.includes(nextStatus)
          : isProvider
            ? providerAllowed.includes(nextStatus)
            : isCustomer
              ? customerAllowed.includes(nextStatus)
              : false;

      if (!allowed) return res.status(403).json({ message: 'Forbidden' });

      // Verification: handyman must enter the customer's code to start (accepted -> in_progress).
      if (role === 'provider' && nextStatus === 'in_progress') {
        if (order.status !== 'accepted') {
          return res.status(400).json({ message: 'Order must be accepted before starting' });
        }
        if ((order as any).verificationCode && !order.verificationVerifiedAt) {
          const code = String(verificationCode || '').trim();
          if (!code) return res.status(400).json({ message: 'verificationCode is required to start this job' });
          if (code !== (order as any).verificationCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
          }
          (order as any).verificationVerifiedAt = new Date();
          (order as any).verificationVerifiedBy = actorId;
          await (order as any).save();
        }
      }

      const updated = await this.orderService.setStatus({
        orderId: req.params.id,
        status: nextStatus,
        by: actorId,
        note,
      });
      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ message: 'Error updating order status', error });
    }
  }

  async rateOrder(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const { stars, note } = req.body || {};
      const nStars = Number(stars);
      if (!Number.isFinite(nStars) || nStars < 1 || nStars > 5) {
        return res.status(400).json({ message: 'stars must be a number between 1 and 5' });
      }

      const order = await this.orderService.getById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      if (order.status !== 'completed') return res.status(400).json({ message: 'Order must be completed before rating' });
      if (!order.providerId) return res.status(400).json({ message: 'Order has no assigned handyman yet' });

      const actorId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(actorId);
      if (role !== 'customer' && role !== 'provider') return res.status(403).json({ message: 'Forbidden' });

      const isCustomer = order.customerId?.toString() === req.userId;
      const isProvider = order.providerId?.toString() === req.userId;
      if (role === 'customer' && !isCustomer) return res.status(403).json({ message: 'Forbidden' });
      if (role === 'provider' && !isProvider) return res.status(403).json({ message: 'Forbidden' });

      const cleanNote = typeof note === 'string' ? note.trim().slice(0, 500) : undefined;
      const now = new Date();

      if (role === 'customer') {
        if ((order as any).customerRating) return res.status(400).json({ message: 'You already rated this handyman' });
        (order as any).customerRating = { stars: Math.round(nStars), note: cleanNote || undefined, at: now };
        await (order as any).save();
        await this.userService.applyRating({
          userId: new Types.ObjectId(order.providerId as any),
          kind: 'asHandyman',
          stars: Math.round(nStars),
        });
        return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: true }));
      }

      // role === 'provider'
      if ((order as any).handymanRating) return res.status(400).json({ message: 'You already rated this customer' });
      (order as any).handymanRating = { stars: Math.round(nStars), note: cleanNote || undefined, at: now };
      await (order as any).save();
      await this.userService.applyRating({
        userId: new Types.ObjectId(order.customerId as any),
        kind: 'asCustomer',
        stars: Math.round(nStars),
      });
      return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: false }));
    } catch (error) {
      return res.status(500).json({ message: 'Error rating order', error });
    }
  }
}
