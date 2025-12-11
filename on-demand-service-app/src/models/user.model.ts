export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export class UserModel {
    constructor(private userData: User) {}

    public getUserData(): User {
        return this.userData;
    }

    public updateUserData(updatedData: Partial<User>): void {
        this.userData = { ...this.userData, ...updatedData };
    }

    // Additional methods for database interaction can be added here
}