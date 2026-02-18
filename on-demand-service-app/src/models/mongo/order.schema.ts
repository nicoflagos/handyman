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
  // Deprecated (v1). Kept for backward compatibility with older clients.
  zip?: string;
  country: string;
  state: string;
  lga: string;
  verificationCode?: string;
  verificationVerifiedAt?: Date;
  verificationVerifiedBy?: Types.ObjectId;
  customerRating?: { stars: number; note?: string; at: Date };
  handymanRating?: { stars: number; note?: string; at: Date };
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
    zip: { type: String, required: false, trim: true, index: true },
    country: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true, index: true },
    lga: { type: String, required: true, trim: true, index: true },
    verificationCode: { type: String, required: false, trim: true, index: false },
    verificationVerifiedAt: { type: Date, required: false },
    verificationVerifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    customerRating: {
      type: {
        stars: { type: Number, required: true, min: 1, max: 5 },
        note: { type: String, required: false },
        at: { type: Date, required: true },
      },
      required: false,
    },
    handymanRating: {
      type: {
        stars: { type: Number, required: true, min: 1, max: 5 },
        note: { type: String, required: false },
        at: { type: Date, required: true },
      },
      required: false,
    },
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
