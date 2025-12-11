import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import UserController from '../controllers/user.controller';
import OrdersController from '../controllers/orders.controller';

const router = Router();

const authController = new AuthController();
const userController = new UserController();
const ordersController = new OrdersController();

// Authentication routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

// User routes
router.get('/users/:id', userController.getUser);
router.put('/users/:id', userController.updateUser);

// Order routes
router.post('/orders', ordersController.createOrder);
router.get('/orders/:id', ordersController.getOrder);
router.put('/orders/:id', ordersController.updateOrder);

export default router;