import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { OrderService } from '../services/order.service';
import { UserService } from '../services/user.service';
import { OrderStatus } from '../models/mongo/order.schema';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Transaction } from '../models/mongo/transaction.schema';

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

    if (isAdmin) {
      const customer = await this.userService.getPublicProfile(new Types.ObjectId(String(plain.customerId)));
      const handyman = await this.userService.getPublicProfile(new Types.ObjectId(String(plain.providerId)));
      plain.customerInfo = customer;
      plain.handymanInfo = handyman;
      return plain;
    }

    // Only share the *other party's* contact info:
    // - customer sees handyman
    // - handyman sees customer
    if (isCustomer) {
      const handyman = await this.userService.getPublicProfile(new Types.ObjectId(String(plain.providerId)));
      const h: any = handyman?.toObject ? handyman.toObject() : handyman;
      if (h) {
        delete h.ratingAsCustomerAvg;
        delete h.ratingAsCustomerCount;
      }
      plain.handymanInfo = h;
      return plain;
    }

    if (isHandyman) {
      const customer = await this.userService.getPublicProfile(new Types.ObjectId(String(plain.customerId)));
      const c: any = customer?.toObject ? customer.toObject() : customer;
      if (c) {
        delete c.ratingAsHandymanAvg;
        delete c.ratingAsHandymanCount;
      }
      plain.customerInfo = c;
      return plain;
    }

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
      const { serviceKey, title, description, address, scheduledAt, country, state, lga, price } = req.body || {};
      const nPrice = Number(price);
      if (!serviceKey || !title || !country || !state || !lga || !Number.isFinite(nPrice) || nPrice <= 0) {
        return res.status(400).json({ message: 'serviceKey, title, country, state, lga, and price are required' });
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
        price: nPrice,
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

      if (role === 'provider' && (nextStatus === 'in_progress' || nextStatus === 'completed')) {
        return res.status(400).json({ message: 'Use the start/complete endpoints for jobs' });
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

  private saveOrderImage(opts: { orderId: string; kind: 'before' | 'after'; file: { mimetype?: string; buffer?: Buffer } }) {
    if (!opts.file?.buffer) throw new Error('file is required');
    if (!opts.file.mimetype || !opts.file.mimetype.startsWith('image/')) throw new Error('Only image uploads are allowed');

    const ext =
      opts.file.mimetype === 'image/png'
        ? 'png'
        : opts.file.mimetype === 'image/webp'
          ? 'webp'
          : opts.file.mimetype === 'image/gif'
            ? 'gif'
            : 'jpg';

    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'orders', opts.orderId, opts.kind);
    fs.mkdirSync(uploadsDir, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const fullPath = path.join(uploadsDir, name);
    fs.writeFileSync(fullPath, opts.file.buffer);
    return `/uploads/orders/${opts.orderId}/${opts.kind}/${name}`;
  }

  async confirmPrice(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const actorId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(actorId);
      if (role !== 'provider') return res.status(403).json({ message: 'Only handymen can confirm price' });

      const order = await this.orderService.getById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      if (!order.providerId || order.providerId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
      if (order.status !== 'accepted') return res.status(400).json({ message: 'Order must be accepted first' });

      (order as any).priceConfirmed = true;
      (order as any).priceConfirmedAt = new Date();
      await (order as any).save();
      return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: false }));
    } catch (error) {
      return res.status(500).json({ message: 'Error confirming price', error });
    }
  }

  async startOrder(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const actorId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(actorId);
      if (role !== 'provider') return res.status(403).json({ message: 'Only handymen can start jobs' });

      const order: any = await this.orderService.getById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      if (!order.providerId || order.providerId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
      if (order.status !== 'accepted') return res.status(400).json({ message: 'Order must be accepted before starting' });
      if (!order.priceConfirmed) return res.status(400).json({ message: 'Confirm price before starting' });

      const code = String((req.body?.verificationCode || '')).trim();
      if (order.verificationCode && !order.verificationVerifiedAt) {
        if (!code) return res.status(400).json({ message: 'verificationCode is required to start this job' });
        if (code !== order.verificationCode) return res.status(400).json({ message: 'Invalid verification code' });
        order.verificationVerifiedAt = new Date();
        order.verificationVerifiedBy = actorId;
      }

      const file = (req as any).file as any;
      const url = this.saveOrderImage({ orderId: String(order._id), kind: 'before', file });
      order.beforeImageUrls = Array.isArray(order.beforeImageUrls) ? order.beforeImageUrls : [];
      order.beforeImageUrls.push(url);

      // Fund escrow: customer pays job fee + 10% platform fee, held until completion.
      if (!order.escrowFundedAt) {
        const jobFee = Number(order.price || 0);
        if (!Number.isFinite(jobFee) || jobFee <= 0) return res.status(400).json({ message: 'Order price is invalid' });
        const platformFee = Math.round(jobFee * 0.1);
        const total = jobFee + platformFee;

        const customer: any = await this.userService.getById(String(order.customerId));
        if (!customer) return res.status(400).json({ message: 'Customer not found' });
        if (typeof customer.walletBalance !== 'number') customer.walletBalance = 100000;
        if (customer.walletBalance < total) return res.status(400).json({ message: 'Customer wallet balance is insufficient' });

        customer.walletBalance -= total;
        await customer.save();

        await Transaction.create([
          {
            userId: new Types.ObjectId(String(order.customerId)),
            direction: 'out',
            type: 'order_escrow_debit',
            amount: jobFee,
            currency: 'NGN',
            ref: `order:${order._id}`,
            meta: { orderId: String(order._id) },
          },
          {
            userId: new Types.ObjectId(String(order.customerId)),
            direction: 'out',
            type: 'platform_fee',
            amount: platformFee,
            currency: 'NGN',
            ref: `order:${order._id}`,
            meta: { orderId: String(order._id) },
          },
        ]);

        order.escrowTotal = total;
        order.escrowJobAmount = jobFee;
        order.escrowPlatformFee = platformFee;
        order.escrowFundedAt = new Date();
      }

      order.status = 'in_progress';
      order.timeline.push({ status: 'in_progress', at: new Date(), by: actorId });
      await order.save();
      return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: false }));
    } catch (error: any) {
      return res.status(400).json({ message: error?.message || 'Unable to start order' });
    }
  }

  async completeOrder(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const actorId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(actorId);
      if (role !== 'provider') return res.status(403).json({ message: 'Only handymen can complete jobs' });

      const order: any = await this.orderService.getById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      if (!order.providerId || order.providerId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
      if (order.status !== 'in_progress') return res.status(400).json({ message: 'Order must be in progress to complete' });

      const file = (req as any).file as any;
      const url = this.saveOrderImage({ orderId: String(order._id), kind: 'after', file });
      order.afterImageUrls = Array.isArray(order.afterImageUrls) ? order.afterImageUrls : [];
      order.afterImageUrls.push(url);

      if (!order.escrowFundedAt) return res.status(400).json({ message: 'Escrow not funded' });
      if (order.escrowReleasedAt) return res.status(400).json({ message: 'Escrow already released' });

      const jobFee = Number(order.escrowJobAmount || order.price || 0);
      if (!Number.isFinite(jobFee) || jobFee <= 0) return res.status(400).json({ message: 'Order price is invalid' });

      const commission = Math.round(jobFee * 0.1);
      const payout = jobFee - commission;
      if (payout < 0) return res.status(400).json({ message: 'Order payout is invalid' });

      const handyman: any = await this.userService.getById(String(order.providerId));
      if (!handyman) return res.status(400).json({ message: 'Handyman not found' });
      if (typeof handyman.walletBalance !== 'number') handyman.walletBalance = 100000;
      handyman.walletBalance += payout;
      await handyman.save();

      await Transaction.create([
        {
          userId: new Types.ObjectId(String(order.providerId)),
          direction: 'in',
          type: 'order_payout',
          amount: payout,
          currency: 'NGN',
          ref: `order:${order._id}`,
          meta: { orderId: String(order._id), gross: jobFee, commission },
        },
        {
          userId: new Types.ObjectId(String(order.providerId)),
          direction: 'out',
          type: 'platform_fee',
          amount: commission,
          currency: 'NGN',
          ref: `order:${order._id}`,
          meta: { orderId: String(order._id) },
        },
      ]);

      order.escrowReleasedAt = new Date();
      order.status = 'completed';
      order.timeline.push({ status: 'completed', at: new Date(), by: actorId });
      await order.save();
      return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: false }));
    } catch (error: any) {
      return res.status(400).json({ message: error?.message || 'Unable to complete order' });
    }
  }
}
