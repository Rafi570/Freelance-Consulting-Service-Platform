import { z } from 'zod';

const createGigFilterValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Filter name must be at least 2 characters')
      .max(60, 'Filter name cannot exceed 60 characters'),
    label: z.string().trim().optional(),
    type: z.enum(['CATEGORY', 'TAG', 'FEATURED']).default('CATEGORY'),
    description: z.string().trim().max(250).optional(),
    icon: z.string().trim().optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

const updateGigFilterValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    label: z.string().trim().optional(),
    type: z.enum(['CATEGORY', 'TAG', 'FEATURED']).optional(),
    description: z.string().trim().max(250).optional(),
    icon: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const GigFilterValidation = {
  createGigFilterValidationSchema,
  updateGigFilterValidationSchema,
};
