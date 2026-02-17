import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'canceled';

export type OrderTimelineEvent = {
  status: OrderStatus;
  at: Date;
  by?: Types.ObjectId;
  note?: string;
};

export interface IOrderDocument extends Document {
  customerId: Types.ObjectId;
  providerId?: Types.ObjectId;
  serviceKey: string;
  title: string;
  description?: string;
  address?: string;
  scheduledAt?: Date;
  status: OrderStatus;
  timeline: OrderTimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    serviceKey: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    address: { type: String },
    scheduledAt: { type: Date },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'in_progress', 'completed', 'canceled'],
      default: 'requested',
      index: true,
    },
    timeline: {
      type: [
        {
          status: { type: String, required: true },
          at: { type: Date, required: true },
          by: { type: Schema.Types.ObjectId, ref: 'User', required: false },
          note: { type: String, required: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export const Order = model<IOrderDocument>('Order', OrderSchema);

