import { z } from 'zod';

const createProviderValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional().default([]),
    phone: z.string().optional(),
    address: z.string().optional(),
    experience: z.string().optional(),
    portfolioUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
    hourlyRate: z.number().positive('Hourly rate must be a positive number').optional(),
  }),
});

const updateProviderValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    experience: z.string().optional(),
    portfolioUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
    hourlyRate: z.number().positive().optional(),
  }),
});

export const ProviderValidation = {
  createProviderValidationSchema,
  updateProviderValidationSchema,
};
