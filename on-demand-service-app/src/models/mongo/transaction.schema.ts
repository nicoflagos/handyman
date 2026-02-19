import { Schema, model, Document, Types } from 'mongoose';

export type TransactionDirection = 'in' | 'out';

export type TransactionType =
  | 'wallet_topup'
  | 'order_escrow_debit'
  | 'order_payout'
  | 'platform_fee'
  | 'wallet_adjustment';

export interface ITransactionDocument extends Document {
  userId: Types.ObjectId;
  direction: TransactionDirection;
  type: TransactionType;
  amount: number;
  currency: 'NGN';
  ref?: string;
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    direction: { type: String, enum: ['in', 'out'], required: true, index: true },
    type: {
      type: String,
      enum: ['wallet_topup', 'order_escrow_debit', 'order_payout', 'platform_fee', 'wallet_adjustment'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['NGN'], default: 'NGN' },
    ref: { type: String, required: false, trim: true, index: true },
    meta: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: true },
);

export const Transaction = model<ITransactionDocument>('Transaction', TransactionSchema);

