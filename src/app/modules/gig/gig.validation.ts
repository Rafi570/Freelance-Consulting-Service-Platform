import { z } from 'zod';

const packageSchema = z.object({
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  name: z.string().min(2, 'Package name must be at least 2 characters'),
  description: z.string().min(5, 'Package description must be at least 5 characters'),
  price: z.number().positive('Price must be greater than 0'),
  deliveryTimeInDays: z.number().int().min(1, 'Delivery time must be at least 1 day'),
  revisions: z.number().int().min(0, 'Revisions must be 0 or more').optional().default(1),
  features: z.array(z.string()).optional().default([]),
});

const createGigValidationSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Gig title must be at least 5 characters'),
    description: z.string().min(20, 'Gig description must be at least 20 characters'),
    category: z.string().min(2, 'Category is required'),
    tags: z.array(z.string()).optional().default([]),
    images: z.array(z.string().url('Invalid image URL format')).optional().default([]),
    packages: z
      .array(packageSchema)
      .length(3, 'Every gig must have exactly 3 packages (BASIC, STANDARD, PREMIUM)')
      .refine(
        (pkgs) => {
          const tiers = pkgs.map((p) => p.tier);
          return (
            tiers.includes('BASIC') &&
            tiers.includes('STANDARD') &&
            tiers.includes('PREMIUM')
          );
        },
        {
          message: 'Packages must include all three tiers: BASIC, STANDARD, and PREMIUM',
        }
      ),
  }),
});

const updateGigValidationSchema = z.object({
  body: z.object({
    title: z.string().min(5).optional(),
    description: z.string().min(20).optional(),
    category: z.string().min(2).optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string().url()).optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'DRAFT']).optional(),
    packages: z.array(packageSchema).optional(),
  }),
});

const updateGigStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'PAUSED', 'DRAFT']).optional(),
  }),
});

export const GigValidation = {
  createGigValidationSchema,
  updateGigValidationSchema,
  updateGigStatusValidationSchema,
};
