import jwt from 'jsonwebtoken';
import { User } from '../models/mongo/user.schema';
import config from '../config';

export class AuthService {
    public async register(email: string, password: string, username?: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = (username || normalizedEmail.split('@')[0]).trim();

        const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const emailRegex = new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i');

        const existingUser = await User.findOne({
            $or: [{ email: emailRegex }, { username: normalizedUsername }],
        }).exec();
        if (existingUser) {
            throw new Error('User already exists');
        }

        const user = new User({ email: normalizedEmail, password, username: normalizedUsername });
        await user.save();
        return { email: user.email, username: user.username };
    }

    public async login(email: string, password: string): Promise<string> {
        const normalizedEmail = email.trim().toLowerCase();
        const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const emailRegex = new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i');

        // Case-insensitive lookup so users can log in even if they registered with different casing.
        const user = await User.findOne({ email: emailRegex }).exec();
        if (!user) {
            throw new Error('Invalid email or password');
        }
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }
        const token = jwt.sign({ userId: user._id, email: user.email }, config.jwtSecret, { expiresIn: '24h' });
        return token;
    }

    public verifyToken(token: string) {
        try {
            return jwt.verify(token, config.jwtSecret) as any;
        } catch (err) {
            throw new Error('Invalid token');
        }
    }
}
