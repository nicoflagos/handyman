import { Schema, model } from 'mongoose';

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productIds: { type: [String], default: [] },
  status: { type: String, enum: ['pending', 'completed', 'canceled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Order = model('Order', OrderSchema);
