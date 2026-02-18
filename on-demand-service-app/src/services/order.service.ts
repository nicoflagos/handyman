import { Types } from 'mongoose';
import { Order, OrderStatus } from '../models/mongo/order.schema';

type CreateOrderInput = {
  customerId: Types.ObjectId;
  serviceKey: string;
  title: string;
  description?: string;
  address?: string;
  country: string;
  state: string;
  lga: string;
  scheduledAt?: Date;
};

export class OrderService {
  async createOrder(input: CreateOrderInput) {
    const order = new Order({
      customerId: input.customerId,
      serviceKey: input.serviceKey,
      title: input.title,
      description: input.description,
      address: input.address,
      country: input.country,
      state: input.state,
      lga: input.lga,
      scheduledAt: input.scheduledAt,
      status: 'requested',
      timeline: [{ status: 'requested', at: new Date(), by: input.customerId }],
    });
    await order.save();
    return order;
  }

  async getById(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) return null;
    return Order.findById(orderId).exec();
  }

  async listForUser(opts: { userId: Types.ObjectId; role: 'customer' | 'provider' | 'admin' }) {
    if (opts.role === 'admin') {
      return Order.find({}).sort({ createdAt: -1 }).limit(100).exec();
    }
    if (opts.role === 'provider') {
      return Order.find({ providerId: opts.userId }).sort({ createdAt: -1 }).limit(100).exec();
    }
    return Order.find({ customerId: opts.userId }).sort({ createdAt: -1 }).limit(100).exec();
  }

  async listMarketplace(opts: { limit?: number; country?: string; state?: string; lga?: string; serviceKeys?: string[] }) {
    const query: any = { status: 'requested', providerId: { $exists: false } };
    if (opts.country) query.country = opts.country;
    if (opts.state) query.state = opts.state;
    if (opts.lga) query.lga = opts.lga;
    if (opts.serviceKeys && opts.serviceKeys.length > 0) query.serviceKey = { $in: opts.serviceKeys };

    return Order.find(query)
      .sort({ createdAt: -1 })
      .limit(opts.limit ?? 50)
      .exec();
  }

  async acceptOrder(opts: { orderId: string; providerId: Types.ObjectId }) {
    if (!Types.ObjectId.isValid(opts.orderId)) return null;
    const order = await Order.findById(opts.orderId).exec();
    if (!order) return null;
    if (order.status !== 'requested') throw new Error('Order is not available');
    if (order.providerId) throw new Error('Order already assigned');

    order.providerId = opts.providerId;
    order.status = 'accepted';
    order.timeline.push({ status: 'accepted', at: new Date(), by: opts.providerId });
    await order.save();
    return order;
  }

  async setStatus(opts: { orderId: string; status: OrderStatus; by: Types.ObjectId; note?: string }) {
    if (!Types.ObjectId.isValid(opts.orderId)) return null;
    const order = await Order.findById(opts.orderId).exec();
    if (!order) return null;

    order.status = opts.status;
    order.timeline.push({ status: opts.status, at: new Date(), by: opts.by, note: opts.note });
    await order.save();
    return order;
  }
}
