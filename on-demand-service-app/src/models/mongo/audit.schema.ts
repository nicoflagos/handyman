import { Schema, model, Document, Types } from 'mongoose';

export type AuditAction = 'VIEW_PROVIDER_ID_IMAGE';

export interface IAuditLogDocument extends Document {
  actorId: Types.ObjectId;
  action: AuditAction;
  targetType: 'User' | 'Order' | 'Transaction';
  targetId: Types.ObjectId;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    meta: { type: Schema.Types.Mixed, required: false },
  },
  { timestamps: true },
);

export const AuditLog = model<IAuditLogDocument>('AuditLog', AuditLogSchema);

