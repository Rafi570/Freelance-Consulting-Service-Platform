import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewController } from './review.controller';
import { ReviewValidation } from './review.validation';

const router = Router();

// Submit rating and comment for a completed order (CLIENT, SUPER_ADMIN)
router.post(
  '/',
  auth('CLIENT', 'SUPER_ADMIN'),
  validateRequest(ReviewValidation.createReviewValidationSchema),
  ReviewController.createReview
);

// Get all reviews and rating breakdown for a gig (Public)
router.get(
  '/gig/:gigId',
  ReviewController.getGigReviews
);

// Get review of a specific order (CLIENT, PROVIDER, SUPER_ADMIN)
router.get(
  '/order/:orderId',
  auth('CLIENT', 'PROVIDER', 'SUPER_ADMIN'),
  ReviewController.getOrderReview
);

export const ReviewRoutes = router;
