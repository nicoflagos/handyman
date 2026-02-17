import { Express, Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { OrdersController } from '../controllers/orders.controller';
import { ServicesController } from '../controllers/services.controller';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { OrderService } from '../services/order.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

const authController = new AuthController(new AuthService());
const userController = new UserController(new UserService());
const servicesController = new ServicesController();
const ordersController = new OrdersController(new OrderService(), new UserService());

// Authentication routes
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/register', (req, res) => authController.register(req, res));

// Service catalog (public)
router.get('/services', (req, res) => servicesController.list(req, res));

// User routes
router.get('/users/:id', authMiddleware, (req, res) => userController.getUserProfile(req, res));
router.put('/users/:id', authMiddleware, (req, res) => userController.updateUserProfile(req, res));

// Order routes
router.get('/orders', authMiddleware, (req, res) => ordersController.listMyOrders(req as any, res));
router.get('/marketplace/orders', authMiddleware, (req, res) => ordersController.listMarketplace(req as any, res));
router.post('/orders', authMiddleware, (req, res) => ordersController.createOrder(req as any, res));
router.get('/orders/:id', authMiddleware, (req, res) => ordersController.getOrder(req as any, res));
router.post('/orders/:id/accept', authMiddleware, (req, res) => ordersController.acceptOrder(req as any, res));
router.post('/orders/:id/status', authMiddleware, (req, res) => ordersController.setStatus(req as any, res));

export function setRoutes(app: Express) {
  app.use('/api', router);
}
