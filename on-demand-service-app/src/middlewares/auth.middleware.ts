import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

type AuthRequest = Request & { userId?: string; role?: 'customer' | 'provider' | 'admin' };

type JwtPayload = {
    userId?: string;
    role?: 'customer' | 'provider' | 'admin';
};

function readCookie(req: Request, name: string): string | null {
    const header = req.headers.cookie;
    if (!header) return null;
    const parts = header.split(';').map(p => p.trim());
    for (const part of parts) {
        const idx = part.indexOf('=');
        if (idx <= 0) continue;
        const k = part.slice(0, idx).trim();
        if (k !== name) continue;
        const v = part.slice(idx + 1);
        try {
            return decodeURIComponent(v);
        } catch {
            return v;
        }
    }
    return null;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const headerToken = req.headers.authorization?.split(' ')[1];
    const cookieToken = readCookie(req, config.authCookieName);
    const token = headerToken || cookieToken;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, config.jwtSecret, (err: unknown, decoded: unknown) => {
        if (err) {
            const name = (err as any)?.name;
            if (name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            }
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }
        if (!decoded || typeof decoded === 'string') {
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }

        const payload = decoded as JwtPayload;
        req.userId = payload.userId;
        req.role = payload.role;
        return next();
    });
};
