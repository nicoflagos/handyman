import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';

export class OrdersController {
    constructor(private orderService: OrderService) {}

    async createOrder(req: Request, res: Response) {
        try {
            const orderData = req.body;
            const newOrder = await this.orderService.createOrder(orderData);
            return res.status(201).json(newOrder);
        } catch (error) {
            return res.status(500).json({ message: 'Error creating order', error });
        }
    }

    async getOrder(req: Request, res: Response) {
        try {
            const orderId = Number(req.params.id);
            const order = await this.orderService.getOrderById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            return res.status(200).json(order);
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving order', error });
        }
    }

    async updateOrder(req: Request, res: Response) {
        try {
            const orderId = Number(req.params.id);
            const orderData = req.body;
            const updatedOrder = await this.orderService.updateOrder(orderId, orderData);
            if (!updatedOrder) {
                return res.status(404).json({ message: 'Order not found' });
            }
            return res.status(200).json(updatedOrder);
        } catch (error) {
            return res.status(500).json({ message: 'Error updating order', error });
        }
    }
}
