import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { UserService } from '../services/user.service';

type AuthRequest = Request & { userId?: string };

export class UserController {
    constructor(private userService: UserService) {}

    async getMe(req: AuthRequest, res: Response) {
        try {
            if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
            const user = await this.userService.getById(req.userId);
            if (!user) return res.status(404).json({ message: 'User not found' });
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
}
