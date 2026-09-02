import express, { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { PaymentController } from './payment.controller';
import { PaymentValidation } from './payment.validation';

const router = Router();

// Create Checkout Session for Client Order Payment
router.post(
  '/create-order-checkout',
  auth('CLIENT', 'PROVIDER', 'SUPER_ADMIN'),
  validateRequest(PaymentValidation.createOrderCheckoutValidationSchema),
  PaymentController.createOrderCheckoutSession
);

// Create Checkout Session for Provider Premium Subscription ($15)
router.post(
  '/create-subscription-checkout',
  auth('PROVIDER'),
  PaymentController.createSubscriptionCheckoutSession
);

// Verify Payment Session by Session ID (Public / Direct Check)
router.get(
  '/verify/:sessionId',
  validateRequest(PaymentValidation.verifySessionValidationSchema),
  PaymentController.verifyPaymentSession
);

// Get User's Payment History
router.get(
  '/my-payments',
  auth('CLIENT', 'PROVIDER', 'SUPER_ADMIN'),
  PaymentController.getMyPayments
);

// Stripe Webhook Endpoint (Receives raw body for signature verification)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleStripeWebhook
);

export const PaymentRoutes = router;
