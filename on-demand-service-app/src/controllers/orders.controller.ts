import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { OrderService } from '../services/order.service';
import { UserService } from '../services/user.service';
import { OrderStatus } from '../models/mongo/order.schema';

type AuthRequest = Request & { userId?: string };

export class OrdersController {
  constructor(private orderService: OrderService, private userService: UserService) {}

  async listMyOrders(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const userObjectId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(userObjectId);
      const orders = await this.orderService.listForUser({ userId: userObjectId, role });
      return res.status(200).json(orders);
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
      if (!profile?.zip) {
        return res.status(400).json({ message: 'Set your provider ZIP before browsing the marketplace' });
      }
      if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
        return res.status(400).json({ message: 'Select at least one skill before browsing the marketplace' });
      }

      const orders = await this.orderService.listMarketplace({
        limit: 50,
        zip: profile.zip,
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
      const { serviceKey, title, description, address, scheduledAt, zip } = req.body || {};
      if (!serviceKey || !title || !zip) {
        return res.status(400).json({ message: 'serviceKey, title, and zip are required' });
      }

      const customerId = new Types.ObjectId(req.userId);
      const order = await this.orderService.createOrder({
        customerId,
        serviceKey,
        title,
        description,
        address,
        zip,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      });
      return res.status(201).json(order);
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
      if (!(role === 'admin' || isCustomer || isProvider)) {
        // Allow providers to view *unassigned* requested orders that match their profile,
        // so they can review details before accepting.
        if (role === 'provider' && order.status === 'requested' && !order.providerId) {
          const provider = await this.userService.getProviderProfile(viewerId);
          const profile = provider?.providerProfile;
          const matches =
            !!profile?.available &&
            !!profile?.zip &&
            profile.zip === (order as any).zip &&
            Array.isArray(profile.skills) &&
            profile.skills.includes(order.serviceKey);

          if (matches) {
            return res.status(200).json(order);
          }
        }

        return res.status(403).json({ message: 'Forbidden' });
      }

      return res.status(200).json(order);
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
      const { status, note } = req.body || {};
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
}
