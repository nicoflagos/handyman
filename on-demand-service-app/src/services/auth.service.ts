export class AuthService {
    private users: { [key: string]: { password: string } } = {};

    constructor() {
        // Initialize with some dummy users for demonstration
        this.users['user@example.com'] = { password: 'password123' };
    }

    public validateCredentials(email: string, password: string): boolean {
        const user = this.users[email];
        return user ? user.password === password : false;
    }

    public generateToken(email: string): string {
        // In a real application, you would use a library to generate a JWT token
        return `token-for-${email}`;
    }

    public registerUser(email: string, password: string): boolean {
        if (this.users[email]) {
            return false; // User already exists
        }
        this.users[email] = { password };
        return true; // User registered successfully
    }
}