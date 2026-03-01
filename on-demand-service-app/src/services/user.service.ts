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
        '_id username firstName lastName gender avatarUrl role ratingAsCustomerAvg ratingAsCustomerCount ratingAsHandymanAvg ratingAsHandymanCount providerProfile.workImageUrls providerProfile.verified providerProfile.verifiedAt',
      )
      .exec();
  }

  async addProviderWorkImage(userId: Types.ObjectId, url: string) {
    const clean = String(url || '').trim();
    if (!clean) return null;
    await User.updateOne({ _id: userId }, { $push: { 'providerProfile.workImageUrls': clean } }).exec();
    return User.findById(userId).select('-password').exec();
  }

  async removeProviderWorkImage(userId: Types.ObjectId, url: string) {
    const clean = String(url || '').trim();
    if (!clean) return null;
    await User.updateOne({ _id: userId }, { $pull: { 'providerProfile.workImageUrls': clean } }).exec();
    return User.findById(userId).select('-password').exec();
  }

  async addPushToken(userId: Types.ObjectId, token: string) {
    const clean = token.trim();
    if (!clean) return null;
    await User.updateOne({ _id: userId }, { $addToSet: { pushTokens: clean } }).exec();
    return User.findById(userId).select('-password').exec();
  }

  async removePushToken(userId: Types.ObjectId, token: string) {
    const clean = token.trim();
    if (!clean) return null;
    await User.updateOne({ _id: userId }, { $pull: { pushTokens: clean } }).exec();
    return User.findById(userId).select('-password').exec();
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
      lc?: string;
      skills?: string[];
      available?: boolean;
      availabilityNote?: string;
      workImageUrls?: string[];
      address?: string;
      idType?: 'nin' | 'voters_card';
      idNumber?: string;
    },
  ) {
    const update: any = {};
    if (typeof input.zip === 'string') update['providerProfile.zip'] = input.zip.trim();
    if (typeof input.country === 'string') update['providerProfile.country'] = input.country.trim();
    if (typeof input.state === 'string') update['providerProfile.state'] = input.state.trim();
    if (typeof input.lga === 'string') update['providerProfile.lga'] = input.lga.trim();
    if (typeof input.lc === 'string') update['providerProfile.lc'] = input.lc.trim();
    if (Array.isArray(input.skills)) update['providerProfile.skills'] = input.skills;
    if (typeof input.available === 'boolean') update['providerProfile.available'] = input.available;
    if (typeof input.availabilityNote === 'string') update['providerProfile.availabilityNote'] = input.availabilityNote;
    if (Array.isArray(input.workImageUrls)) update['providerProfile.workImageUrls'] = input.workImageUrls;
    if (typeof input.address === 'string') update['providerProfile.address'] = input.address.trim();

    if (typeof input.idType === 'string') {
      if (input.idType !== 'nin' && input.idType !== 'voters_card') throw new Error('Invalid idType');
      update['providerProfile.idType'] = input.idType;
    }
    if (typeof input.idNumber === 'string') {
      let idType = (typeof input.idType === 'string' ? input.idType : undefined) as 'nin' | 'voters_card' | undefined;
      if (!idType) {
        const current = await User.findById(userId).select('providerProfile.idType').exec();
        idType = (current as any)?.providerProfile?.idType as any;
      }
      const cleaned = input.idNumber.trim().replace(/[\s-]/g, '');
      if (idType === 'nin' && !/^\d{11}$/.test(cleaned)) throw new Error('NIN must be exactly 11 digits');
      if (idType === 'voters_card' && !/^[A-Z0-9]{19}$/i.test(cleaned)) throw new Error('Voters Card must be exactly 19 characters');
      update['providerProfile.idNumber'] = cleaned;
    }
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
