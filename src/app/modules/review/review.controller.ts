import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReviewService } from './review.service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const orderId = (req.params.id || req.params.orderId || req.body.orderId) as string;

  const result = await ReviewService.createReview(user.id, user.role, {
    orderId,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review and rating submitted successfully!',
    data: result,
  });
});

const getGigReviews = catchAsync(async (req: Request, res: Response) => {
  const gigId = req.params.gigId as string;
  const result = await ReviewService.getGigReviews(gigId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Gig reviews and ratings retrieved successfully!',
    data: result,
  });
});

const getOrderReview = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const orderId = (req.params.orderId || req.params.id) as string;
  const result = await ReviewService.getOrderReview(orderId, user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order review retrieved successfully!',
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getGigReviews,
  getOrderReview,
};
