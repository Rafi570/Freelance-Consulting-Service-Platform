import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = Router();

// Get all users with filtering & search (SUPER_ADMIN only)
router.get(
  '/',
  auth('SUPER_ADMIN'),
  UserController.getAllUsers
);

// Get single user details (SUPER_ADMIN only)
router.get(
  '/:id',
  auth('SUPER_ADMIN'),
  UserController.getSingleUser
);

// Block user or provider (SUPER_ADMIN only)
router.patch(
  '/:id/block',
  auth('SUPER_ADMIN'),
  validateRequest(UserValidation.blockUserValidationSchema),
  UserController.blockUser
);

// Unblock user or provider (SUPER_ADMIN only)
router.patch(
  '/:id/unblock',
  auth('SUPER_ADMIN'),
  UserController.unblockUser
);

// Activate user or provider (SUPER_ADMIN only)
router.patch(
  '/:id/activate',
  auth('SUPER_ADMIN'),
  UserController.activateUser
);

// Set user or provider to draft (SUPER_ADMIN only)
router.patch(
  '/:id/draft',
  auth('SUPER_ADMIN'),
  UserController.draftUser
);

// Update user status directly (SUPER_ADMIN only)
router.patch(
  '/:id/status',
  auth('SUPER_ADMIN'),
  validateRequest(UserValidation.updateUserStatusValidationSchema),
  UserController.updateUserStatus
);

export const UserRoutes = router;
