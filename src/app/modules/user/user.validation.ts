import { z } from 'zod';

const statusEnum = z.preprocess((val) => {
  if (typeof val === 'string') {
    const upper = val.toUpperCase().trim();
    if (upper === 'BLOCK') return 'BLOCKED';
    return upper;
  }
  return val;
}, z.enum(['ACTIVE', 'BLOCKED', 'SUSPENDED', 'DRAFT']));

const blockUserValidationSchema = z.object({
  body: z
    .object({
      status: statusEnum.optional(),
      reason: z.string().optional(),
    })
    .optional(),
});

const updateUserStatusValidationSchema = z.object({
  body: z.object({
    status: statusEnum,
    reason: z.string().optional(),
  }),
});

export const UserValidation = {
  blockUserValidationSchema,
  updateUserStatusValidationSchema,
};
