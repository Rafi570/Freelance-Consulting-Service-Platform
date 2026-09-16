import { z } from 'zod';

const createReviewValidationSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID format').optional(),
    rating: z
      .number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating cannot exceed 5'),
    comment: z
      .string()
      .trim()
      .min(2, 'Comment must be at least 2 characters')
      .max(1000, 'Comment cannot exceed 1000 characters'),
  }),
});

export const ReviewValidation = {
  createReviewValidationSchema,
};
