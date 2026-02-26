import { Schema, model, Document, Types } from 'mongoose';

export interface IMessageDocument extends Document {
  orderId: Types.ObjectId;
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

MessageSchema.index({ orderId: 1, createdAt: -1 });

export const Message = model<IMessageDocument>('Message', MessageSchema);

