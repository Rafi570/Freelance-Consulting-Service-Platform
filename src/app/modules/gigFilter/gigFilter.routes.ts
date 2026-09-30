import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { GigFilterController } from './gigFilter.controller';
import { GigFilterValidation } from './gigFilter.validation';

const router = Router();

// 1. Create a new Gig Filter (SUPER_ADMIN ONLY)
router.post(
  '/',
  auth('SUPER_ADMIN'),
  validateRequest(GigFilterValidation.createGigFilterValidationSchema),
  GigFilterController.createGigFilter
);

// 2. Get all Gig Filters (Public & Admin)
router.get('/', GigFilterController.getAllGigFilters);

// 3. Get single Gig Filter
router.get('/:id', GigFilterController.getSingleGigFilter);

// 4. Update Gig Filter (SUPER_ADMIN ONLY)
router.patch(
  '/:id',
  auth('SUPER_ADMIN'),
  validateRequest(GigFilterValidation.updateGigFilterValidationSchema),
  GigFilterController.updateGigFilter
);

// 5. Delete Gig Filter (SUPER_ADMIN ONLY)
router.delete(
  '/:id',
  auth('SUPER_ADMIN'),
  GigFilterController.deleteGigFilter
);

export const GigFilterRoutes = router;
