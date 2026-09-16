import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { OrderController } from './order.controller';
import { OrderValidation } from './order.validation';
import { ReviewController } from '../review/review.controller';
import { ReviewValidation } from '../review/review.validation';

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

// Submit rating and comment for a completed order (CLIENT, SUPER_ADMIN)
router.post(
  '/:id/review',
  auth('CLIENT', 'SUPER_ADMIN'),
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ReviewController.createReview
);

// Get review for an order (CLIENT, PROVIDER, SUPER_ADMIN)
router.get(
  '/:id/review',
  auth('CLIENT', 'PROVIDER', 'SUPER_ADMIN'),
  ReviewController.getOrderReview
);

export const OrderRoutes = router;
