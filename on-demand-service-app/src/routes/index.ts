import { Express, Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { OrdersController } from '../controllers/orders.controller';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { OrderService } from '../services/order.service';

const router = Router();

const authController = new AuthController(new AuthService());
const userController = new UserController(new UserService());
const ordersController = new OrdersController(new OrderService());

// Authentication routes
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/register', (req, res) => authController.register(req, res));

// User routes
router.get('/users/:id', (req, res) => userController.getUserProfile(req, res));
router.put('/users/:id', (req, res) => userController.updateUserProfile(req, res));

// Order routes
router.post('/orders', (req, res) => ordersController.createOrder(req, res));
router.get('/orders/:id', (req, res) => ordersController.getOrder(req, res));
router.put('/orders/:id', (req, res) => ordersController.updateOrder(req, res));

export function setRoutes(app: Express) {
  app.use('/api', router);
}
