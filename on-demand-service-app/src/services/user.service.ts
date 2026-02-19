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

  async updateAvatar(userId: Types.ObjectId, avatarUrl: string) {
    return User.findByIdAndUpdate(userId, { $set: { avatarUrl } }, { new: true }).select('-password').exec();
  }

  async getPublicProfile(userId: Types.ObjectId) {
    return User.findById(userId)
      .select(
        '_id username firstName lastName phone gender avatarUrl role ratingAsCustomerAvg ratingAsCustomerCount ratingAsHandymanAvg ratingAsHandymanCount',
      )
      .exec();
  }

  async getRole(userId: Types.ObjectId): Promise<'customer' | 'provider' | 'admin'> {
    const user = await User.findById(userId).select('role').exec();
    return (user as any)?.role || 'customer';
  }

  async getProviderProfile(userId: Types.ObjectId) {
    const user = await User.findById(userId).select('role providerProfile').exec();
    return user as any;
  }

  async updateProviderProfile(
    userId: Types.ObjectId,
    input: {
      zip?: string;
      country?: string;
      state?: string;
      lga?: string;
      skills?: string[];
      available?: boolean;
      availabilityNote?: string;
    },
  ) {
    const update: any = {};
    if (typeof input.zip === 'string') update['providerProfile.zip'] = input.zip.trim();
    if (typeof input.country === 'string') update['providerProfile.country'] = input.country.trim();
    if (typeof input.state === 'string') update['providerProfile.state'] = input.state.trim();
    if (typeof input.lga === 'string') update['providerProfile.lga'] = input.lga.trim();
    if (Array.isArray(input.skills)) update['providerProfile.skills'] = input.skills;
    if (typeof input.available === 'boolean') update['providerProfile.available'] = input.available;
    if (typeof input.availabilityNote === 'string') update['providerProfile.availabilityNote'] = input.availabilityNote;
    return User.findByIdAndUpdate(userId, { $set: update }, { new: true }).select('-password').exec();
  }

  async applyRating(opts: { userId: Types.ObjectId; kind: 'asCustomer' | 'asHandyman'; stars: number }) {
    const user = await User.findById(opts.userId)
      .select('ratingAsCustomerAvg ratingAsCustomerCount ratingAsHandymanAvg ratingAsHandymanCount')
      .exec();
    if (!user) return null;

    const stars = Math.max(1, Math.min(5, Math.round(opts.stars)));
    if (opts.kind === 'asCustomer') {
      const count = Number((user as any).ratingAsCustomerCount || 0);
      const avg = Number((user as any).ratingAsCustomerAvg || 0);
      const nextCount = count + 1;
      const nextAvg = (avg * count + stars) / nextCount;
      (user as any).ratingAsCustomerCount = nextCount;
      (user as any).ratingAsCustomerAvg = nextAvg;
    } else {
      const count = Number((user as any).ratingAsHandymanCount || 0);
      const avg = Number((user as any).ratingAsHandymanAvg || 0);
      const nextCount = count + 1;
      const nextAvg = (avg * count + stars) / nextCount;
      (user as any).ratingAsHandymanCount = nextCount;
      (user as any).ratingAsHandymanAvg = nextAvg;
    }

    await (user as any).save();
    return user as any;
  }
}
