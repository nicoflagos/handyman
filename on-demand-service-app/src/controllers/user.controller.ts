import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { UserService } from '../services/user.service';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Transaction } from '../models/mongo/transaction.schema';

type AuthRequest = Request & { userId?: string };

export class UserController {
    constructor(private userService: UserService) {}

    async getMe(req: AuthRequest, res: Response) {
        try {
            if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
            const user = await this.userService.getById(req.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });
            // Backfill wallet for existing accounts.
            if (typeof (user as any).walletBalance !== 'number') {
                (user as any).walletBalance = 100000;
                await (user as any).save();
            }
            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Server error', error });
        }
    }

    async updateProviderProfile(req: AuthRequest, res: Response) {
        try {
            if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
            const userId = new Types.ObjectId(req.userId);
            const role = await this.userService.getRole(userId);
            if (role !== 'provider' && role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

            const { zip, country, state, lga, skills, available, availabilityNote } = req.body || {};
            const updated = await this.userService.updateProviderProfile(userId, {
                zip,
                country,
                state,
                lga,
                skills,
                available,
                availabilityNote,
            });
            return res.status(200).json(updated);
        } catch (error) {
            return res.status(500).json({ message: 'Server error', error });
        }
    }

    async getUserProfile(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const user = await this.userService.getById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Server error', error });
        }
    }

    async updateUserProfile(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const updatedData = req.body;
            const updatedUser = await this.userService.updateProfile(userId, updatedData);
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.status(200).json(updatedUser);
        } catch (error) {
            return res.status(500).json({ message: 'Server error', error });
        }
    }

    async uploadAvatar(req: AuthRequest, res: Response) {
        try {
            if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
            const userId = new Types.ObjectId(req.userId);

            const anyReq = req as any;
            const file = anyReq.file as { originalname?: string; mimetype?: string; buffer?: Buffer } | undefined;
            if (!file || !file.buffer) return res.status(400).json({ message: 'file is required' });
            if (!file.mimetype || !file.mimetype.startsWith('image/')) {
                return res.status(400).json({ message: 'Only image uploads are allowed' });
            }

            const ext =
                file.mimetype === 'image/png'
                    ? 'png'
                    : file.mimetype === 'image/webp'
                      ? 'webp'
                      : file.mimetype === 'image/gif'
                        ? 'gif'
                        : 'jpg';

            const uploadsDir = path.resolve(process.cwd(), 'uploads', 'profile');
            fs.mkdirSync(uploadsDir, { recursive: true });

            const name = `${req.userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
            const fullPath = path.join(uploadsDir, name);
            fs.writeFileSync(fullPath, file.buffer);

            const avatarUrl = `/uploads/profile/${name}`;
            const updated = await this.userService.updateAvatar(userId, avatarUrl);
            return res.status(200).json(updated);
        } catch (error) {
            return res.status(500).json({ message: 'Server error', error });
        }
    }

    async listMyTransactions(req: AuthRequest, res: Response) {
        try {
            if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
            const userId = new Types.ObjectId(req.userId);
            const items = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(50).exec();
            return res.status(200).json(items);
        } catch (error) {
            return res.status(500).json({ message: 'Server error', error });
        }
    }

    async topUpWallet(req: AuthRequest, res: Response) {
        try {
            if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
            const { amount } = req.body || {};
            const n = Number(amount);
            if (!Number.isFinite(n) || n <= 0) return res.status(400).json({ message: 'amount must be a positive number' });

            const userId = new Types.ObjectId(req.userId);
            const user: any = await this.userService.getById(req.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });
            if (typeof user.walletBalance !== 'number') user.walletBalance = 100000;
            user.walletBalance += n;
            await user.save();

            await Transaction.create({
                userId,
                direction: 'in',
                type: 'wallet_topup',
                amount: n,
                currency: 'NGN',
                ref: `topup:${Date.now()}`,
            });

            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Server error', error });
        }
    }
}
