import { AuthService } from '../services/auth.service';
import jwt from 'jsonwebtoken';
import config from '../config';

export class AuthController {
    constructor(private authService: AuthService) {}

    async register(req: any, res: any) {
        try {
            const { firstName, lastName, phone, gender, email, password, username, role } = req.body || {};
            if (!firstName || !lastName || !phone || !gender || !email || !password) {
                return res
                    .status(400)
                    .json({ message: 'firstName, lastName, phone, gender, email, and password are required' });
            }
            const user = await this.authService.register({
                email,
                password,
                username,
                role,
                firstName,
                lastName,
                phone,
                gender,
            });
            res.status(201).json(user);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async login(req: any, res: any) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password required' });
            }
            const token = await this.authService.login(email, password);
            const decoded: any = jwt.decode(token);
            const maxAge = decoded?.exp ? Math.max(Number(decoded.exp) * 1000 - Date.now(), 0) : undefined;

            // HttpOnly cookie auth (recommended). Token is also returned for backward compatibility.
            res.cookie(config.authCookieName, token, {
                httpOnly: true,
                secure:
                    String(process.env.NODE_ENV || '').toLowerCase() === 'production' ||
                    config.authCookieSameSite === 'none',
                sameSite: config.authCookieSameSite,
                domain: config.authCookieDomain,
                path: '/',
                ...(typeof maxAge === 'number' ? { maxAge } : {}),
            });

            res.status(200).json({ token, expiresIn: config.jwtExpiresIn });
        } catch (error: any) {
            res.status(401).json({ message: error.message });
        }
    }

    async logout(_req: any, res: any) {
        try {
            res.cookie(config.authCookieName, '', {
                httpOnly: true,
                secure:
                    String(process.env.NODE_ENV || '').toLowerCase() === 'production' ||
                    config.authCookieSameSite === 'none',
                sameSite: config.authCookieSameSite,
                domain: config.authCookieDomain,
                path: '/',
                maxAge: 0,
            });
            return res.status(200).json({ ok: true });
        } catch (error: any) {
            return res.status(200).json({ ok: true });
        }
    }

    async verifyEmail(req: any, res: any) {
        try {
            const { email, code } = req.body || {};
            if (!email || !code) return res.status(400).json({ message: 'email and code are required' });
            const result = await this.authService.verifyEmail({ email, code });
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }

    async resendVerifyEmail(req: any, res: any) {
        try {
            const { email } = req.body || {};
            if (!email) return res.status(400).json({ message: 'email is required' });
            const result = await this.authService.resendEmailVerification({ email });
            return res.status(200).json(result);
        } catch (error: any) {
            return res.status(400).json({ message: error.message });
        }
    }
}
