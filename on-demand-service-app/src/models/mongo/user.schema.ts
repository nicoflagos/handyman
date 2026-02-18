import { Schema, model, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

export type UserRole = 'customer' | 'provider' | 'admin';

export type ProviderProfile = {
  zip?: string;
  skills: string[];
  available: boolean;
  availabilityNote?: string;
};

interface IUserDocument extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  providerProfile?: ProviderProfile;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer', index: true },
  providerProfile: {
    zip: { type: String, required: false, trim: true },
    skills: { type: [String], default: [] },
    available: { type: Boolean, default: true },
    availabilityNote: { type: String, required: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcryptjs.compare(password, this.password);
};

export const User = model<IUserDocument>('User', UserSchema);
