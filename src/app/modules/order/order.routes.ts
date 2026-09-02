import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { OrderController } from './order.controller';
import { OrderValidation } from './order.validation';

const router = Router();

// Get valid cancellation reasons list for dropdown
router.get(
  '/cancellation-reasons',
  OrderController.getCancellationReasons
);

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

// Update order status (IN_PROGRESS, COMPLETED, etc.)
router.patch(
  '/:id/status',
  auth('CLIENT', 'PROVIDER', 'SUPER_ADMIN'),
  validateRequest(OrderValidation.updateOrderStatusValidationSchema),
  OrderController.updateOrderStatus
);

// Cancel order with valid reason (CLIENT, PROVIDER, SUPER_ADMIN)
router.patch(
  '/:id/cancel',
  auth('CLIENT', 'PROVIDER', 'SUPER_ADMIN'),
  validateRequest(OrderValidation.cancelOrderValidationSchema),
  OrderController.cancelOrder
);

export const OrderRoutes = router;
