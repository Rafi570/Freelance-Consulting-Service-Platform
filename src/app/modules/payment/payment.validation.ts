import { z } from 'zod';

const createOrderCheckoutValidationSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID format'),
  }),
});

const verifySessionValidationSchema = z.object({
  params: z.object({
    sessionId: z.string().min(5, 'Invalid session ID'),
  }),
});

export const PaymentValidation = {
  createOrderCheckoutValidationSchema,
  verifySessionValidationSchema,
};
