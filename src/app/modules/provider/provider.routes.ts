import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from '../user/user.controller';
import { UserValidation } from '../user/user.validation';
import { ProviderController } from './provider.controller';
import { ProviderValidation } from './provider.validation';

const router = Router();

// Create Provider Account (Register as Provider)
router.post(
  '/register',
  validateRequest(ProviderValidation.createProviderValidationSchema),
  ProviderController.createProvider
);

// Get Logged-in Provider's Profile
router.get(
  '/me',
  auth('PROVIDER', 'SUPER_ADMIN'),
  ProviderController.getMyProfile
);

// Update Logged-in Provider's Profile
router.patch(
  '/me',
  auth('PROVIDER', 'SUPER_ADMIN'),
  validateRequest(ProviderValidation.updateProviderValidationSchema),
  ProviderController.updateMyProfile
);

// --- SUPER_ADMIN Provider Status Management ---
// Update provider status (ACTIVE, DRAFT, BLOCKED) (SUPER_ADMIN only)
router.patch(
  '/:id/status',
  auth('SUPER_ADMIN'),
  validateRequest(UserValidation.updateUserStatusValidationSchema),
  UserController.updateUserStatus
);

// Block a provider (SUPER_ADMIN only)
router.patch(
  '/:id/block',
  auth('SUPER_ADMIN'),
  validateRequest(UserValidation.blockUserValidationSchema),
  UserController.blockUser
);

// Set provider to draft (SUPER_ADMIN only)
router.patch(
  '/:id/draft',
  auth('SUPER_ADMIN'),
  UserController.draftUser
);

// Activate / unblock a provider (SUPER_ADMIN only)
router.patch(
  '/:id/activate',
  auth('SUPER_ADMIN'),
  UserController.activateUser
);

router.patch(
  '/:id/unblock',
  auth('SUPER_ADMIN'),
  UserController.unblockUser
);

// Public: Get all providers
router.get('/', ProviderController.getAllProviders);

// Public: Get single provider by id
router.get('/:id', ProviderController.getSingleProvider);

export const ProviderRoutes = router;
