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

const cancelOrderValidationSchema = z.object({
  body: z.object({
    cancellationReason: z.enum([
      'MUTUAL_AGREEMENT',
      'PROVIDER_UNRESPONSIVE',
      'REQUIREMENTS_MISMATCH',
      'TECHNICAL_DIFFICULTIES',
      'POOR_COMMUNICATION',
      'DELAYED_DELIVERY',
      'ORDERED_BY_MISTAKE',
      'OTHER',
    ]),
    cancellationNote: z
      .string()
      .max(500, 'Cancellation note must be at most 500 characters')
      .optional(),
  }),
});

export const OrderValidation = {
  createOrderValidationSchema,
  updateOrderStatusValidationSchema,
  cancelOrderValidationSchema,
};
