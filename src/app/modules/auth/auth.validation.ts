import { z } from 'zod';

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

const registerValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['PROVIDER', 'CLIENT']).optional().default('PROVIDER'),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional().default([]),
    phone: z.string().optional(),
    address: z.string().optional(),
    experience: z.string().optional(),
    portfolioUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
    hourlyRate: z.number().positive('Hourly rate must be a positive number').optional(),
  }),
});

const verifyEmailValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be a 6-digit code'),
  }),
});

const resendOtpValidationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const AuthValidation = {
  loginValidationSchema,
  registerValidationSchema,
  verifyEmailValidationSchema,
  resendOtpValidationSchema,
};
