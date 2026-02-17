import { Types } from 'mongoose';
import { User } from '../models/mongo/user.schema';

export class UserService {
  async getById(userId: string) {
    if (!Types.ObjectId.isValid(userId)) return null;
    return User.findById(userId).select('-password').exec();
  }

  async updateProfile(userId: string, updatedData: { username?: string }) {
    if (!Types.ObjectId.isValid(userId)) return null;
    const update: any = {};
    if (updatedData.username) update.username = updatedData.username;
    return User.findByIdAndUpdate(userId, update, { new: true }).select('-password').exec();
  }

  async getRole(userId: Types.ObjectId): Promise<'customer' | 'provider' | 'admin'> {
    const user = await User.findById(userId).select('role').exec();
    return (user as any)?.role || 'customer';
  }
}

