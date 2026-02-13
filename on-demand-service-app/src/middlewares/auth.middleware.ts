import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

type AuthRequest = Request & { userId?: string };

type JwtPayload = {
    userId?: string;
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, config.jwtSecret, (err: unknown, decoded: unknown) => {
        if (err || !decoded || typeof decoded === 'string') {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }

        const payload = decoded as JwtPayload;
        req.userId = payload.userId;
        return next();
    });
};
