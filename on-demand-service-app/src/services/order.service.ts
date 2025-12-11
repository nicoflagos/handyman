export class OrderService {
    private orders: any[] = []; // This will hold the orders in memory for demonstration purposes

    createOrder(orderData: any) {
        const newOrder = { id: this.orders.length + 1, ...orderData };
        this.orders.push(newOrder);
        return newOrder;
    }

    getOrderById(orderId: number) {
        return this.orders.find(order => order.id === orderId);
    }

    updateOrder(orderId: number, updatedData: any) {
        const orderIndex = this.orders.findIndex(order => order.id === orderId);
        if (orderIndex === -1) {
            throw new Error('Order not found');
        }
        this.orders[orderIndex] = { ...this.orders[orderIndex], ...updatedData };
        return this.orders[orderIndex];
    }

    getAllOrders() {
        return this.orders;
    }
}