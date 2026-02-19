import { AuthService } from '../services/auth.service';

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
            res.status(200).json({ token });
        } catch (error: any) {
            res.status(401).json({ message: error.message });
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
