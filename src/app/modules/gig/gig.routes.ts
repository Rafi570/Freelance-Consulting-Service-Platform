import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { GigController } from './gig.controller';
import { GigValidation } from './gig.validation';

const router = Router();

// Create Gig with 3 packages (PROVIDER only)
router.post(
  '/',
  auth('PROVIDER'),
  validateRequest(GigValidation.createGigValidationSchema),
  GigController.createGig
);

// Get logged in provider's own gigs
router.get(
  '/my-gigs',
  auth('PROVIDER', 'SUPER_ADMIN'),
  GigController.getMyGigs
);

// Public: Get all gigs with search & filtering
router.get('/', GigController.getAllGigs);

// Public: Get single gig with full packages
router.get('/:id', GigController.getSingleGig);

// Update gig and packages (PROVIDER only)
router.patch(
  '/:id',
  auth('PROVIDER', 'SUPER_ADMIN'),
  validateRequest(GigValidation.updateGigValidationSchema),
  GigController.updateGig
);

// Toggle/Disable/Enable gig status (PROVIDER only)
router.patch(
  '/:id/toggle-status',
  auth('PROVIDER'),
  validateRequest(GigValidation.updateGigStatusValidationSchema),
  GigController.toggleGigStatus
);

// Delete gig (PROVIDER owner or SUPER_ADMIN)
router.delete(
  '/:id',
  auth('PROVIDER', 'SUPER_ADMIN'),
  GigController.deleteGig
);

export const GigRoutes = router;
