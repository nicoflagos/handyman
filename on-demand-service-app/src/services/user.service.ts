export class UserService {
    private users: any[] = []; // This will hold user data temporarily

    constructor() {}

    createUser(userData: any) {
        const newUser = { id: this.users.length + 1, ...userData };
        this.users.push(newUser);
        return newUser;
    }

    getUserById(userId: number) {
        return this.users.find(user => user.id === userId);
    }

    updateUser(userId: number, updatedData: any) {
        const userIndex = this.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updatedData };
            return this.users[userIndex];
        }
        return null;
    }

    getAllUsers() {
        return this.users;
    }
}