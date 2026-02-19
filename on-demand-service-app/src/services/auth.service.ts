import jwt from 'jsonwebtoken';
import { User } from '../models/mongo/user.schema';
import config from '../config';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

function hashVerificationCode(email: string, code: string) {
    // Hash is scoped to the email to avoid cross-account reuse.
    return crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');
}

async function trySendEmailVerification(opts: { to: string; code: string }) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    if (!host || !port || !from) return false;
    if ((user && !pass) || (!user && pass)) {
        throw new Error('SMTP_USER and SMTP_PASS must be set together');
    }

    const transport = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
    });

    await transport.sendMail({
        from,
        to: opts.to,
        subject: 'Verify your email',
        text: `Your verification code is: ${opts.code}\n\nThis code expires in 30 minutes.`,
    });

    return true;
}

export class AuthService {
    public async register(input: {
        email: string;
        password: string;
        username?: string;
        role?: 'customer' | 'provider';
        firstName?: string;
        lastName?: string;
        phone?: string;
        gender?: 'male' | 'female' | 'other';
    }) {
        const { email, password, username, role, firstName, lastName, phone, gender } = input;
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = (username || normalizedEmail.split('@')[0]).trim();
        const normalizedRole: 'customer' | 'provider' = role === 'provider' ? 'provider' : 'customer';

        const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const emailRegex = new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i');

        const existingUser = await User.findOne({
            $or: [{ email: emailRegex }, { username: normalizedUsername }],
        }).exec();
        if (existingUser) {
            throw new Error('User already exists');
        }

        const user = new User({
            email: normalizedEmail,
            password,
            username: normalizedUsername,
            role: normalizedRole,
            firstName: typeof firstName === 'string' ? firstName.trim() : undefined,
            lastName: typeof lastName === 'string' ? lastName.trim() : undefined,
            phone: typeof phone === 'string' ? phone.trim() : undefined,
            gender,
            // Email verification disabled for now.
            emailVerified: true,
        });
        await user.save();

        return {
            email: user.email,
            username: user.username,
            role: user.role,
            emailVerified: (user as any).emailVerified,
        };
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
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                username: (user as any).username,
                firstName: (user as any).firstName,
                lastName: (user as any).lastName,
                role: (user as any).role,
            },
            config.jwtSecret,
            { expiresIn: '24h' },
        );
        return token;
    }

    public async verifyEmail(input: { email: string; code: string }) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const code = input.code.trim();
        if (!code) throw new Error('Verification code required');

        const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const emailRegex = new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i');

        const user: any = await User.findOne({ email: emailRegex })
            .select('+emailVerificationCodeHash +emailVerificationExpiresAt emailVerified email username role')
            .exec();
        if (!user) throw new Error('User not found');
        if (user.emailVerified) return { email: user.email, emailVerified: true };

        if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
            throw new Error('No pending email verification for this account');
        }
        if (new Date(user.emailVerificationExpiresAt).getTime() < Date.now()) {
            throw new Error('Verification code expired');
        }

        const expected = user.emailVerificationCodeHash;
        const actual = hashVerificationCode(normalizedEmail, code);
        if (actual !== expected) throw new Error('Invalid verification code');

        user.emailVerified = true;
        user.emailVerificationCodeHash = undefined;
        user.emailVerificationExpiresAt = undefined;
        await user.save();
        return { email: user.email, emailVerified: true };
    }

    public async resendEmailVerification(input: { email: string }) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const emailRegex = new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i');

        const user: any = await User.findOne({ email: emailRegex })
            .select('+emailVerificationCodeHash +emailVerificationExpiresAt emailVerified email')
            .exec();
        if (!user) throw new Error('User not found');
        if (user.emailVerified) return { email: user.email, emailVerified: true, sent: false };

        const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        user.emailVerificationCodeHash = hashVerificationCode(normalizedEmail, code);
        user.emailVerificationExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
        await user.save();

        const nodeEnv = String(process.env.NODE_ENV || '').toLowerCase();
        const isDev = nodeEnv === 'development';
        let sent = false;
        try {
            sent = await trySendEmailVerification({ to: normalizedEmail, code });
            if (!sent) console.log(`[email-verify-resend] ${normalizedEmail} code=${code} (SMTP not configured)`);
            else console.log(`[email-verify-resend] ${normalizedEmail} email sent`);
        } catch (err) {
            console.log(
                `[email-verify-resend] ${normalizedEmail} code=${code} (email send failed): ${(err as any)?.message || err}`,
            );
        }

        return { email: user.email, emailVerified: false, sent, ...(isDev ? { devEmailVerificationCode: code } : {}) };
    }

    public verifyToken(token: string) {
        try {
            return jwt.verify(token, config.jwtSecret) as any;
        } catch (err) {
            throw new Error('Invalid token');
        }
    }
}
