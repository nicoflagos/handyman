import { AuthService } from '../services/auth.service';

export class AuthController {
    constructor(private authService: AuthService) {}

    async register(req: any, res: any) {
        try {
            const { email, password, username } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password required' });
            }
            const user = await this.authService.register(email, password, username);
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
}