import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { OrderController } from './order.controller';
import { OrderValidation } from './order.validation';

const router = Router();

// Place a service order (CLIENT, PROVIDER, SUPER_ADMIN)
router.post(
  '/',
  auth('CLIENT', 'PROVIDER', 'SUPER_ADMIN'),
  validateRequest(OrderValidation.createOrderValidationSchema),
  OrderController.createOrder
);

// Get my orders (orders placed by client, or orders received by provider)
router.get(
  '/my-orders',
  auth('CLIENT', 'PROVIDER', 'SUPER_ADMIN'),
  OrderController.getMyOrders
);

// Get single order details
router.get(
  '/:id',
  auth('CLIENT', 'PROVIDER', 'SUPER_ADMIN'),
  OrderController.getSingleOrder
);

// Update order status
router.patch(
  '/:id/status',
  auth('CLIENT', 'PROVIDER', 'SUPER_ADMIN'),
  validateRequest(OrderValidation.updateOrderStatusValidationSchema),
  OrderController.updateOrderStatus
);

export const OrderRoutes = router;
