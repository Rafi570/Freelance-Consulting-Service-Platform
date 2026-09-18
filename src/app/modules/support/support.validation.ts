import { z } from 'zod';

const createAppealValidationSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    subject: z.string().min(3).optional().default('Appeal for Account Unblocking'),
    message: z.string().min(10, 'Please provide a detailed explanation/reason for unblocking (minimum 10 characters)'),
  }),
});

const createTicketValidationSchema = z.object({
  body: z.object({
    subject: z.string().min(3, 'Subject must be at least 3 characters'),
    category: z
      .enum(['BLOCK_APPEAL', 'ACCOUNT_ISSUE', 'PAYMENT_ISSUE', 'ORDER_DISPUTE', 'GENERAL'])
      .optional()
      .default('BLOCK_APPEAL'),
    message: z.string().min(5, 'Message must be at least 5 characters'),
  }),
});

const sendMessageValidationSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message cannot be empty'),
  }),
});

const reviewAppealValidationSchema = z.object({
  body: z.object({
    action: z.enum(['APPROVE', 'REJECT', 'IN_REVIEW']),
    adminNotes: z.string().optional(),
  }),
});

const checkBlockStatusValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
  }),
});

export const SupportValidation = {
  createAppealValidationSchema,
  createTicketValidationSchema,
  sendMessageValidationSchema,
  reviewAppealValidationSchema,
  checkBlockStatusValidationSchema,
};
