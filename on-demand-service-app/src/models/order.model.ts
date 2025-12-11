export interface Order {
    id: string;
    userId: string;
    productIds: string[];
    status: 'pending' | 'completed' | 'canceled';
    createdAt: Date;
    updatedAt: Date;
}

export class OrderModel {
    constructor(private orderData: Order) {}

    public getOrderData(): Order {
        return this.orderData;
    }

    public updateStatus(newStatus: 'pending' | 'completed' | 'canceled'): void {
        this.orderData.status = newStatus;
        this.orderData.updatedAt = new Date();
    }

    // Additional methods for interacting with the database can be added here
}