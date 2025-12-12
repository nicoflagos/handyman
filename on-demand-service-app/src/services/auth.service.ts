import jwt from 'jsonwebtoken';
import { User } from '../models/mongo/user.schema';
import config from '../config';

export class AuthService {
    public async register(email: string, password: string, username?: string) {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] }).exec();
        if (existingUser) {
            throw new Error('User already exists');
        }
        const user = new User({ email, password, username: username || email.split('@')[0] });
        await user.save();
        return { email, username: user.username };
    }

    public async login(email: string, password: string): Promise<string> {
        const user = await User.findOne({ email }).exec();
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