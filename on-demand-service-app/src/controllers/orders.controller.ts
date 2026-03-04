import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { OrderService } from '../services/order.service';
import { UserService } from '../services/user.service';
import { OrderStatus } from '../models/mongo/order.schema';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Transaction } from '../models/mongo/transaction.schema';
import { getUploadsRootDir } from '../utils/uploads';
import { pushService } from '../services/push.service';
import { User } from '../models/mongo/user.schema';
import { uploadImage } from '../services/media.service';
import { Message } from '../models/mongo/message.schema';

type AuthRequest = Request & { userId?: string };

export class OrdersController {
  constructor(private orderService: OrderService, private userService: UserService) {}

  private async loadOrderAndAuthorizeParty(opts: {
    req: AuthRequest;
    orderId: string;
  }): Promise<{ order: any; role: 'customer' | 'provider' | 'admin'; isCustomer: boolean; isProvider: boolean }> {
    if (!opts.req.userId) throw new Error('Unauthorized');
    const viewerId = new Types.ObjectId(opts.req.userId);
    const role = await this.userService.getRole(viewerId);
    const order = await this.orderService.getById(opts.orderId);
    if (!order) throw new Error('Order not found');
    const isCustomer = String((order as any).customerId) === opts.req.userId;
    const isProvider = String((order as any).providerId || '') === opts.req.userId;
    const isAdmin = role === 'admin';
    if (!(isAdmin || isCustomer || isProvider)) throw new Error('Forbidden');
    return { order, role, isCustomer, isProvider };
  }

  private toSafeOrder(order: any, opts: { includeVerificationCode: boolean }) {
    const plain = order?.toObject ? order.toObject() : order;
    if (!opts.includeVerificationCode) {
      delete plain.verificationCode;
      delete plain.startVerificationCode;
      delete plain.completionVerificationCode;
    }
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
      if (!profile?.country || !profile?.state || !profile?.lga || !profile?.lc) {
        return res.status(400).json({ message: 'Set your handyman Country, State, LGA, and Local Council before browsing the marketplace' });
      }
      if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
        return res.status(400).json({ message: 'Select at least one skill before browsing the marketplace' });
      }

      const orders = await this.orderService.listMarketplace({
        limit: 50,
        country: profile.country,
        state: profile.state,
        lga: profile.lga,
        lc: profile.lc,
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
      const { serviceKey, title, description, address, scheduledAt, country, state, lga, lc, price } = req.body || {};
      const nPrice = Number(price);
      if (!serviceKey || !title || !country || !state || !lga || !lc || !Number.isFinite(nPrice) || nPrice <= 0) {
        return res.status(400).json({ message: 'serviceKey, title, country, state, lga, lc, and price are required' });
      }

      let parsedScheduledAt: Date | undefined = undefined;
      if (scheduledAt) {
        const d = new Date(String(scheduledAt));
        if (Number.isNaN(d.getTime())) {
          return res
            .status(400)
            .json({ message: 'scheduledAt is invalid. Use the date picker or an ISO date like 2026-02-25T14:30' });
        }
        parsedScheduledAt = d;
      }

      // Ensure customer can afford job fee + 5% platform fee (commission).
      const platformFee = Math.round(nPrice * 0.05);
      const total = nPrice + platformFee;
      const customer: any = await this.userService.getById(req.userId);
      if (!customer) return res.status(400).json({ message: 'Customer not found' });
      if (typeof customer.walletBalance !== 'number') {
        customer.walletBalance = 100000;
        await customer.save();
      }
      if (customer.walletBalance < total) {
        return res.status(400).json({
          message: `Insufficient wallet balance. Need \u20A6${total.toLocaleString('en-NG')} (\u20A6${nPrice.toLocaleString('en-NG')} + \u20A6${platformFee.toLocaleString('en-NG')} platform fee).`,
        });
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
        lc,
        price: nPrice,
        scheduledAt: parsedScheduledAt,
      });

      // Notify matching handymen in the same LC (best-effort).
      void (async () => {
        try {
          const orderId = String((order as any)._id);
          const lcName = String((order as any).lc || '').trim();
          const fmt = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;
          const recipients = await User.find({
            role: 'provider',
            'providerProfile.available': true,
            'providerProfile.country': country,
            'providerProfile.state': state,
            'providerProfile.lga': lga,
            'providerProfile.lc': lc,
            'providerProfile.skills': serviceKey,
          })
            .select('_id')
            .limit(50)
            .exec();

          await Promise.all(
            recipients.map(p =>
              pushService
                .notifyUser(p._id as any, {
                  title: 'New job posted',
                  body: `New job in ${lcName || lc} (${lga} LGA, ${state}). Fee: ${fmt(nPrice)}.`,
                  data: { event: 'job_posted', orderId, state, lga, lc },
                })
                .catch(err => console.log(`[push] job posted -> handyman failed: ${(err as any)?.message || err}`)),
            ),
          );
        } catch (err: any) {
          console.log(`[push] job posted failed: ${(err as any)?.message || err}`);
        }
      })();

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

  async listOrderMessages(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const { order } = await this.loadOrderAndAuthorizeParty({ req, orderId: req.params.id });

      if (!(order as any).providerId) return res.status(200).json([]);
      if ((order as any).status === 'requested') return res.status(200).json([]);

      const items = await Message.find({ orderId: (order as any)._id })
        .sort({ createdAt: 1 })
        .limit(200)
        .select('_id orderId fromUserId toUserId text createdAt')
        .exec();
      return res.status(200).json(items);
    } catch (err: any) {
      const msg = err?.message || 'Error listing messages';
      if (msg === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
      if (msg === 'Order not found') return res.status(404).json({ message: 'Order not found' });
      if (msg === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
      return res.status(500).json({ message: msg });
    }
  }

  async sendOrderMessage(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const { order, isCustomer, isProvider } = await this.loadOrderAndAuthorizeParty({ req, orderId: req.params.id });

      if (!(order as any).providerId) return res.status(400).json({ message: 'Order has no assigned handyman yet' });
      if ((order as any).status === 'requested') return res.status(400).json({ message: 'Chat is available after order is accepted' });
      if ((order as any).status === 'completed' || (order as any).status === 'canceled') {
        return res.status(400).json({ message: 'Chat is closed for this order' });
      }

      const text = String(req.body?.text || '').trim();
      if (!text) return res.status(400).json({ message: 'text is required' });
      if (text.length > 1000) return res.status(400).json({ message: 'text is too long' });

      const fromUserId = new Types.ObjectId(req.userId);
      const toUserId = isCustomer ? new Types.ObjectId(String((order as any).providerId)) : new Types.ObjectId(String((order as any).customerId));
      if (!(isCustomer || isProvider)) return res.status(403).json({ message: 'Forbidden' });

      const msgDoc = await Message.create({
        orderId: (order as any)._id,
        fromUserId,
        toUserId,
        text,
      });

      const orderId = String((order as any)._id);
      const title = 'New message';
      const preview = text.length > 120 ? `${text.slice(0, 117)}...` : text;
      void pushService
        .notifyUser(toUserId, {
          title,
          body: preview,
          data: { event: 'chat_message', orderId, messageId: String((msgDoc as any)._id) },
        })
        .catch(e => console.log(`[push] chat message failed: ${(e as any)?.message || e}`));

      return res.status(201).json({
        _id: (msgDoc as any)._id,
        orderId: (msgDoc as any).orderId,
        fromUserId: (msgDoc as any).fromUserId,
        toUserId: (msgDoc as any).toUserId,
        text: (msgDoc as any).text,
        createdAt: (msgDoc as any).createdAt,
      });
    } catch (err: any) {
      const msg = err?.message || 'Error sending message';
      if (msg === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
      if (msg === 'Order not found') return res.status(404).json({ message: 'Order not found' });
      if (msg === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
      return res.status(500).json({ message: msg });
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

      // Push notifications (best-effort).
      const orderId = String((order as any)._id);
      const title = String((order as any).title || 'Order');
      const customerId = (order as any).customerId as Types.ObjectId | undefined;
      const providerId = (order as any).providerId as Types.ObjectId | undefined;

      // Include verified status (and basic public profile info) so the customer sees it immediately on accept.
      const handymanProfile = providerId ? await this.userService.getPublicProfile(providerId) : null;
      const handymanObj: any = handymanProfile?.toObject ? handymanProfile.toObject() : handymanProfile;
      const handymanName =
        [handymanObj?.firstName, handymanObj?.lastName].filter(Boolean).join(' ') || String(handymanObj?.username || '');
      const handymanVerified = !!handymanObj?.providerProfile?.verified;
      const handymanAvatarUrl = handymanObj?.avatarUrl ? String(handymanObj.avatarUrl) : '';
      const handymanRating =
        typeof handymanObj?.ratingAsHandymanAvg === 'number' ? handymanObj.ratingAsHandymanAvg.toFixed(1) : '';

      if (customerId) {
        void pushService
          .notifyUser(customerId, {
            title: 'Order accepted',
            body: `Your order "${title}" was accepted by${handymanVerified ? ' a verified' : ' a'} handyman.`,
            data: {
              event: 'order_accepted',
              orderId,
              handymanId: providerId ? String(providerId) : '',
              handymanName,
              handymanVerified: handymanVerified ? '1' : '0',
              handymanRating,
              handymanAvatarUrl,
            },
          })
          .catch(err => console.log(`[push] order accepted -> customer failed: ${(err as any)?.message || err}`));
      }
      if (providerId) {
        void pushService
          .notifyUser(providerId, {
            title: 'Order accepted',
            body: `You accepted "${title}".`,
            data: { event: 'order_accepted', orderId },
          })
          .catch(err => console.log(`[push] order accepted -> handyman failed: ${(err as any)?.message || err}`));
      }

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

      const providerAllowed: OrderStatus[] = ['arrived', 'in_progress', 'completed'];
      const customerAllowed: OrderStatus[] = ['canceled'];
      const adminAllowed: OrderStatus[] = ['requested', 'accepted', 'arrived', 'in_progress', 'completed', 'canceled'];

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

      // Cancellation rules (customer):
      if (nextStatus === 'canceled' && isCustomer && role !== 'admin') {
        const current = order.status as OrderStatus;
        if (current !== 'requested' && current !== 'accepted' && current !== 'arrived') {
          return res.status(400).json({ message: 'Order can only be canceled before the job starts' });
        }
        if ((order as any).escrowFundedAt) {
          return res.status(400).json({ message: 'Order can only be canceled before the job starts' });
        }
      }

      const updated = await this.orderService.setStatus({
        orderId: req.params.id,
        status: nextStatus,
        by: actorId,
        note,
      });

      // Push notifications (best-effort).
      if (nextStatus === 'canceled') {
        const orderId = String((updated as any)._id);
        const title = String((updated as any).title || 'Order');
        const providerId = (updated as any).providerId as Types.ObjectId | undefined;
        if (providerId) {
          void pushService
            .notifyUser(providerId, {
              title: 'Order canceled',
              body: `Customer canceled "${title}".`,
              data: { event: 'order_canceled', orderId },
            })
            .catch(err => console.log(`[push] order canceled -> handyman failed: ${(err as any)?.message || err}`));
        }
      }
      if (nextStatus === 'arrived') {
        const orderId = String((updated as any)._id);
        const title = String((updated as any).title || 'Order');
        const customerId = (updated as any).customerId as Types.ObjectId | undefined;
        const providerId = (updated as any).providerId as Types.ObjectId | undefined;
        if (customerId) {
          void pushService
            .notifyUser(customerId, {
              title: 'Handyman arrived',
              body: `Handyman arrived for "${title}".`,
              data: { event: 'order_arrived', orderId },
            })
            .catch(err => console.log(`[push] order arrived -> customer failed: ${(err as any)?.message || err}`));
        }
        if (providerId) {
          void pushService
            .notifyUser(providerId, {
              title: 'Marked as arrived',
              body: `You marked "${title}" as arrived.`,
              data: { event: 'order_arrived', orderId },
            })
            .catch(err => console.log(`[push] order arrived -> handyman failed: ${(err as any)?.message || err}`));
        }
      }

      return res.status(200).json(updated);
    } catch (error) {
      return res.status(500).json({ message: 'Error updating order status', error });
    }
  }

  async declineOrder(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const actorId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(actorId);
      if (role !== 'provider' && role !== 'admin') return res.status(403).json({ message: 'Only handymen can decline jobs' });

      const order: any = await this.orderService.getById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      const isAssignedHandyman = order.providerId?.toString() === req.userId;
      if (!(role === 'admin' || isAssignedHandyman)) return res.status(403).json({ message: 'Forbidden' });

      if (order.status !== 'accepted' && order.status !== 'arrived') {
        return res.status(400).json({ message: 'Only accepted jobs can be declined' });
      }
      if (order.escrowFundedAt) return res.status(400).json({ message: 'Cannot decline after job has started' });

      const prevProviderId = order.providerId;
      order.providerId = undefined;
      order.status = 'requested';
      order.timeline.push({ status: 'requested', at: new Date(), by: actorId, note: 'Declined by handyman' });
      await order.save();

      // Notify customer (best-effort).
      const orderId = String(order._id);
      const title = String(order.title || 'Order');
      if (order.customerId) {
        void pushService
          .notifyUser(order.customerId, {
            title: 'Job declined',
            body: `Handyman declined "${title}". It is back in the marketplace.`,
            data: { event: 'order_declined', orderId },
          })
          .catch(err => console.log(`[push] order declined -> customer failed: ${(err as any)?.message || err}`));
      }

      // Notify previously assigned handyman (useful for multi-device).
      if (prevProviderId) {
        void pushService
          .notifyUser(prevProviderId, {
            title: 'Job declined',
            body: `You declined "${title}".`,
            data: { event: 'order_declined', orderId },
          })
          .catch(err => console.log(`[push] order declined -> handyman failed: ${(err as any)?.message || err}`));
      }

      return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: false }));
    } catch (error: any) {
      return res.status(400).json({ message: error?.message || 'Unable to decline job' });
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

  private async saveOrderImage(opts: {
    orderId: string;
    kind: 'before' | 'after' | 'customer';
    file: { mimetype?: string; buffer?: Buffer };
  }) {
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

    const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const cloudUrl = await uploadImage({
      buffer: opts.file.buffer,
      folder: `handyman/orders/${opts.orderId}/${opts.kind}`,
      mimetype: opts.file.mimetype,
    });
    if (cloudUrl) return cloudUrl;

    const uploadsDir = path.join(getUploadsRootDir(), 'orders', opts.orderId, opts.kind);
    fs.mkdirSync(uploadsDir, { recursive: true });
    const fullPath = path.join(uploadsDir, name);
    fs.writeFileSync(fullPath, opts.file.buffer);
    return `/uploads/orders/${opts.orderId}/${opts.kind}/${name}`;
  }

  async uploadCustomerJobImage(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const actorId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(actorId);
      if (role !== 'customer' && role !== 'admin') return res.status(403).json({ message: 'Only customers can upload job photos' });

      const order: any = await this.orderService.getById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      const isCustomer = String(order.customerId) === req.userId;
      const isAdmin = role === 'admin';
      if (!(isAdmin || isCustomer)) return res.status(403).json({ message: 'Forbidden' });

      if (order.status === 'in_progress' || order.status === 'completed' || order.status === 'canceled') {
        return res.status(400).json({ message: 'Job photos can only be uploaded before the job starts' });
      }

      order.customerImageUrls = Array.isArray(order.customerImageUrls) ? order.customerImageUrls : [];
      if (order.customerImageUrls.length >= 2) return res.status(400).json({ message: 'You can upload at most 2 job photos' });

      const file = (req as any).file as any;
      const url = await this.saveOrderImage({ orderId: String(order._id), kind: 'customer', file });
      order.customerImageUrls.push(url);
      await order.save();

      return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: false }));
    } catch (error: any) {
      return res.status(400).json({ message: error?.message || 'Unable to upload job photo' });
    }
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
      if (order.status !== 'accepted' && order.status !== 'arrived') {
        return res.status(400).json({ message: 'Order must be accepted first' });
      }

      (order as any).priceConfirmed = true;
      (order as any).priceConfirmedAt = new Date();
      await (order as any).save();

      const orderId = String((order as any)._id);
      const title = String((order as any).title || 'Order');
      const customerId = (order as any).customerId as Types.ObjectId | undefined;
      if (customerId) {
        void pushService
          .notifyUser(customerId, {
            title: 'Price confirmed',
            body: `Handyman confirmed price for "${title}".`,
            data: { event: 'price_confirmed', orderId },
          })
          .catch(err => console.log(`[push] price confirmed -> customer failed: ${(err as any)?.message || err}`));
      }

      return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: false }));
    } catch (error) {
      return res.status(500).json({ message: 'Error confirming price', error });
    }
  }

  async updateServiceFee(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
      const actorId = new Types.ObjectId(req.userId);
      const role = await this.userService.getRole(actorId);
      if (role !== 'customer' && role !== 'admin') return res.status(403).json({ message: 'Only customers can edit service fee' });

      const order: any = await this.orderService.getById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      const isCustomer = String(order.customerId) === req.userId;
      const isAdmin = role === 'admin';
      if (!(isAdmin || isCustomer)) return res.status(403).json({ message: 'Forbidden' });

      if (order.status !== 'requested' && order.status !== 'accepted' && order.status !== 'arrived') {
        return res.status(400).json({ message: 'Service fee can only be edited before the job starts' });
      }
      if (order.priceConfirmed) {
        return res.status(400).json({ message: 'Service fee cannot be edited after handyman confirms price' });
      }

      const { price } = req.body || {};
      const nPrice = Number(price);
      if (!Number.isFinite(nPrice) || nPrice <= 0) return res.status(400).json({ message: 'price must be a positive number' });

      // Ensure customer can afford job fee + 5% platform fee (commission).
      const platformFee = Math.round(nPrice * 0.05);
      const total = nPrice + platformFee;
      const customer: any = await this.userService.getById(String(order.customerId));
      if (!customer) return res.status(400).json({ message: 'Customer not found' });
      if (typeof customer.walletBalance !== 'number') customer.walletBalance = 100000;
      if (customer.walletBalance < total) {
        return res.status(400).json({
          message: `Insufficient wallet balance. Need \u20A6${total.toLocaleString('en-NG')} (\u20A6${nPrice.toLocaleString('en-NG')} + \u20A6${platformFee.toLocaleString('en-NG')} platform fee).`,
        });
      }

      order.price = nPrice;
      order.priceConfirmed = false;
      order.priceConfirmedAt = undefined;
      order.timeline.push({ status: order.status, at: new Date(), by: actorId, note: `Service fee updated to ₦${nPrice}` });
      await order.save();

      // Notify assigned handyman (if any) that price changed.
      if (order.providerId) {
        void pushService
          .notifyUser(order.providerId, {
            title: 'Service fee updated',
            body: `Customer updated service fee for "${String(order.title || 'Order')}" to ₦${nPrice.toLocaleString('en-NG')}.`,
            data: { event: 'price_updated', orderId: String(order._id) },
          })
          .catch(err => console.log(`[push] price updated -> handyman failed: ${(err as any)?.message || err}`));
      }

      return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: false }));
    } catch (error: any) {
      return res.status(500).json({ message: error?.message || 'Error updating service fee' });
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
      if (order.status !== 'accepted' && order.status !== 'arrived') {
        return res.status(400).json({ message: 'Order must be accepted before starting' });
      }
      if (!order.priceConfirmed) return res.status(400).json({ message: 'Confirm price before starting' });

      const code = String((req.body?.startCode || req.body?.verificationCode || '')).trim();
      const expected = String(order.startVerificationCode || order.verificationCode || '').trim();
      if (expected && !order.verificationVerifiedAt) {
        if (!code) return res.status(400).json({ message: 'startCode is required to start this job' });
        if (code !== expected) return res.status(400).json({ message: 'Invalid start code' });
        order.verificationVerifiedAt = new Date();
        order.verificationVerifiedBy = actorId;
      }

      const file = (req as any).file as any;
      const url = await this.saveOrderImage({ orderId: String(order._id), kind: 'before', file });
      order.beforeImageUrls = Array.isArray(order.beforeImageUrls) ? order.beforeImageUrls : [];
      order.beforeImageUrls.push(url);

      // Fund escrow: customer pays job fee + 5% platform fee, held until completion.
      if (!order.escrowFundedAt) {
        const jobFee = Number(order.price || 0);
        if (!Number.isFinite(jobFee) || jobFee <= 0) return res.status(400).json({ message: 'Order price is invalid' });
        const platformFee = Math.round(jobFee * 0.05);
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

      // Push notifications (best-effort).
      const orderId = String(order._id);
      const title = String(order.title || 'Order');
      const jobFee = Number(order.escrowJobAmount || order.price || 0);
      const platformFee = Number(order.escrowPlatformFee || Math.round(jobFee * 0.05));
      const total = jobFee + platformFee;
      const fmt = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

      if (order.customerId) {
        void pushService
          .notifyUser(order.customerId, {
            title: 'Job started',
            body: `Job started for "${title}". ${fmt(total)} held in escrow.`,
            data: { event: 'order_in_progress', orderId },
          })
          .catch(err => console.log(`[push] order in_progress -> customer failed: ${(err as any)?.message || err}`));
      }
      if (order.providerId) {
        void pushService
          .notifyUser(order.providerId, {
            title: 'Job started',
            body: `You started "${title}". Escrow funded (${fmt(jobFee)} + ${fmt(platformFee)} fee).`,
            data: { event: 'order_in_progress', orderId },
          })
          .catch(err => console.log(`[push] order in_progress -> handyman failed: ${(err as any)?.message || err}`));
      }

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

      const code = String((req.body?.completionCode || req.body?.verificationCode || '')).trim();
      const expected = String(order.completionVerificationCode || order.verificationCode || '').trim();
      if (expected) {
        if (!code) return res.status(400).json({ message: 'completionCode is required to complete this job' });
        if (code !== expected) return res.status(400).json({ message: 'Invalid completion code' });
      }

      const file = (req as any).file as any;
      const url = await this.saveOrderImage({ orderId: String(order._id), kind: 'after', file });
      order.afterImageUrls = Array.isArray(order.afterImageUrls) ? order.afterImageUrls : [];
      order.afterImageUrls.push(url);

      if (!order.escrowFundedAt) return res.status(400).json({ message: 'Escrow not funded' });
      if (order.escrowReleasedAt) return res.status(400).json({ message: 'Escrow already released' });

      const jobFee = Number(order.escrowJobAmount || order.price || 0);
      if (!Number.isFinite(jobFee) || jobFee <= 0) return res.status(400).json({ message: 'Order price is invalid' });

      const commission = Math.round(jobFee * 0.05);
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

      // Push notifications (best-effort).
      const orderId = String(order._id);
      const title = String(order.title || 'Order');
      const fmt = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;
      if (order.customerId) {
        void pushService
          .notifyUser(order.customerId, {
            title: 'Job completed',
            body: `Job completed for "${title}". Escrow released to handyman.`,
            data: { event: 'order_completed', orderId },
          })
          .catch(err => console.log(`[push] order completed -> customer failed: ${(err as any)?.message || err}`));
      }
      if (order.providerId) {
        void pushService
          .notifyUser(order.providerId, {
            title: 'Payment released',
            body: `Payment released for "${title}". You received ${fmt(payout)} (commission ${fmt(commission)}).`,
            data: { event: 'escrow_released', orderId },
          })
          .catch(err => console.log(`[push] order completed -> handyman failed: ${(err as any)?.message || err}`));
      }

      return res.status(200).json(this.toSafeOrder(order, { includeVerificationCode: false }));
    } catch (error: any) {
      return res.status(400).json({ message: error?.message || 'Unable to complete order' });
    }
  }
}
