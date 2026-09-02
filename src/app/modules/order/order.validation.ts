import { z } from 'zod';

const createOrderValidationSchema = z.object({
  body: z.object({
    gigId: z.string().uuid('Invalid gig ID format'),
    packageId: z.string().uuid('Invalid package ID format'),
    requirements: z.string().optional(),
  }),
});

const updateOrderStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  }),
});

export const OrderValidation = {
  createOrderValidationSchema,
  updateOrderStatusValidationSchema,
};
