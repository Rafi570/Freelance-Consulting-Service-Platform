import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
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

// Public: Get all providers
router.get('/', ProviderController.getAllProviders);

// Public: Get single provider by id
router.get('/:id', ProviderController.getSingleProvider);

export const ProviderRoutes = router;
