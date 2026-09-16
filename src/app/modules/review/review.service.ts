import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

interface ICreateReviewPayload {
  orderId: string;
  rating: number;
  comment: string;
}

const createReview = async (
  userId: string,
  role: string,
  payload: ICreateReviewPayload
) => {
  const { orderId, rating, comment } = payload;

  if (!orderId) {
    throw new AppError(400, 'Order ID is required to submit a review.');
  }

  // 1. Fetch order with existing review
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      review: true,
      gig: true,
    },
  });

  if (!order) {
    throw new AppError(404, 'Order not found.');
  }

  // 2. Authorization check: only the client who ordered (or admin) can review
  if (order.clientId !== userId && role !== 'SUPER_ADMIN') {
    throw new AppError(
      403,
      'You are not authorized to review this order. Only the client who placed the order can submit a review and rating.'
    );
  }

  // 3. Strict status check: order must be COMPLETED
  if (order.status !== 'COMPLETED') {
    throw new AppError(
      400,
      `Cannot submit review! Reviews and ratings can only be given once the order is COMPLETED. Current order status is ${order.status}.`
    );
  }

  // 4. Check if review already exists
  if (order.review) {
    throw new AppError(
      400,
      'A review and rating has already been submitted for this order.'
    );
  }

  // 5. Create Review
  const newReview = await prisma.review.create({
    data: {
      orderId,
      gigId: order.gigId,
      clientId: order.clientId,
      rating,
      comment,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      gig: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
      order: {
        select: {
          id: true,
          status: true,
          price: true,
          createdAt: true,
        },
      },
    },
  });

  return newReview;
};

const getGigReviews = async (gigId: string) => {
  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
  });

  if (!gig) {
    throw new AppError(404, 'Gig not found.');
  }

  const reviews = await prisma.review.findMany({
    where: { gigId },
    orderBy: { createdAt: 'desc' },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? parseFloat(
          (
            reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
          ).toFixed(1)
        )
      : 0;

  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return {
    gigId,
    totalReviews,
    averageRating,
    ratingDistribution,
    reviews,
  };
};

const getOrderReview = async (
  orderId: string,
  userId: string,
  role: string
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      gig: true,
      review: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError(404, 'Order not found.');
  }

  const isClient = order.clientId === userId;
  const isProvider = order.gig.providerId === userId;
  const isAdmin = role === 'SUPER_ADMIN';

  if (!isClient && !isProvider && !isAdmin) {
    throw new AppError(403, 'You are not authorized to view this review.');
  }

  if (!order.review) {
    throw new AppError(404, 'No review has been submitted for this order yet.');
  }

  return order.review;
};

export const ReviewService = {
  createReview,
  getGigReviews,
  getOrderReview,
};
