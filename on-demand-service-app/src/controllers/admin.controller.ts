import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { UserService } from '../services/user.service';
import { User } from '../models/mongo/user.schema';
import { Order } from '../models/mongo/order.schema';
import { Transaction } from '../models/mongo/transaction.schema';
import { AuditLog } from '../models/mongo/audit.schema';

type AuthRequest = Request & { userId?: string };

export class AdminController {
  constructor(private userService: UserService) {}

  private async requireAdmin(req: AuthRequest): Promise<Types.ObjectId> {
    if (!req.userId) throw new Error('Unauthorized');
    const actorId = new Types.ObjectId(req.userId);
    const role = await this.userService.getRole(actorId);
    if (role !== 'admin') throw new Error('Forbidden');
    return actorId;
  }

  async listUsers(req: AuthRequest, res: Response) {
    try {
      await this.requireAdmin(req);
      const q = String(req.query.q || '').trim();
      const role = String(req.query.role || '').trim();
      const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));

      const query: any = {};
      if (role) query.role = role;
      if (q) {
        query.$or = [
          { email: new RegExp(q, 'i') },
          { username: new RegExp(q, 'i') },
          { firstName: new RegExp(q, 'i') },
          { lastName: new RegExp(q, 'i') },
          { phone: new RegExp(q, 'i') },
        ];
      }

      const users = await User.find(query)
        .select(
          '_id username firstName lastName email phone gender role avatarUrl walletBalance createdAt updatedAt providerProfile.country providerProfile.state providerProfile.lga providerProfile.lc providerProfile.skills providerProfile.available providerProfile.availabilityNote providerProfile.workImageUrls providerProfile.address providerProfile.passportPhotoUrl providerProfile.idType providerProfile.idNumber providerProfile.idImageUrl providerProfile.verified providerProfile.verifiedAt',
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return res.status(200).json(users);
    } catch (err: any) {
      const msg = err?.message || 'Error';
      if (msg === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
      if (msg === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
      return res.status(500).json({ message: msg });
    }
  }

  async listOrders(req: AuthRequest, res: Response) {
    try {
      await this.requireAdmin(req);
      const status = String(req.query.status || '').trim();
      const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));

      const query: any = {};
      if (status) query.status = status;

      const orders = await Order.find(query).sort({ createdAt: -1 }).limit(limit).exec();
      return res.status(200).json(orders);
    } catch (err: any) {
      const msg = err?.message || 'Error';
      if (msg === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
      if (msg === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
      return res.status(500).json({ message: msg });
    }
  }

  async listTransactions(req: AuthRequest, res: Response) {
    try {
      await this.requireAdmin(req);
      const userId = String(req.query.userId || '').trim();
      const limit = Math.min(500, Math.max(1, Number(req.query.limit || 200)));

      const query: any = {};
      if (userId) {
        if (!Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'userId is invalid' });
        query.userId = new Types.ObjectId(userId);
      }

      const txns = await Transaction.find(query).sort({ createdAt: -1 }).limit(limit).exec();
      return res.status(200).json(txns);
    } catch (err: any) {
      const msg = err?.message || 'Error';
      if (msg === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
      if (msg === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
      return res.status(500).json({ message: msg });
    }
  }

  async getProviderIdImage(req: AuthRequest, res: Response) {
    try {
      const actorId = await this.requireAdmin(req);
      const userId = String(req.params.id || '').trim();
      if (!Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'User id is invalid' });

      const user: any = await User.findById(userId).select('_id providerProfile.idImageUrl').exec();
      const url = String(user?.providerProfile?.idImageUrl || '').trim();
      if (!url) return res.status(404).json({ message: 'No ID image found' });

      await AuditLog.create([
        {
          actorId,
          action: 'VIEW_PROVIDER_ID_IMAGE',
          targetType: 'User',
          targetId: new Types.ObjectId(userId),
          meta: { url },
        },
      ]);

      return res.status(200).json({ url });
    } catch (err: any) {
      const msg = err?.message || 'Error';
      if (msg === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
      if (msg === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
      return res.status(500).json({ message: msg });
    }
  }

  async getProviderPassportPhoto(req: AuthRequest, res: Response) {
    try {
      const actorId = await this.requireAdmin(req);
      const userId = String(req.params.id || '').trim();
      if (!Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'User id is invalid' });

      const user: any = await User.findById(userId).select('_id providerProfile.passportPhotoUrl').exec();
      const url = String(user?.providerProfile?.passportPhotoUrl || '').trim();
      if (!url) return res.status(404).json({ message: 'No passport photo found' });

      await AuditLog.create([
        {
          actorId,
          action: 'VIEW_PROVIDER_PASSPORT_PHOTO',
          targetType: 'User',
          targetId: new Types.ObjectId(userId),
          meta: { url },
        },
      ]);

      return res.status(200).json({ url });
    } catch (err: any) {
      const msg = err?.message || 'Error';
      if (msg === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
      if (msg === 'Forbidden') return res.status(403).json({ message: 'Forbidden' });
      return res.status(500).json({ message: msg });
    }
  }
}
