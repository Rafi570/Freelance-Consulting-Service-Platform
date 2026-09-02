import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentService } from './payment.service';

const createOrderCheckoutSession = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { orderId } = req.body;
  const result = await PaymentService.createOrderCheckoutSession(user.id, orderId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Stripe order checkout session created successfully!',
    data: result,
  });
});

const createSubscriptionCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user;
    const result = await PaymentService.createSubscriptionCheckoutSession(user.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Stripe subscription checkout session created successfully!',
      data: result,
    });
  }
);

const verifyPaymentSession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const result = await PaymentService.verifyPaymentSession(sessionId as string);

  sendResponse(res, {
    statusCode: 200,
    success: result.success,
    message: result.message,
    data: result,
  });
});

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const result = await PaymentService.handleStripeWebhook(signature, req.body);

  res.status(200).json(result);
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await PaymentService.getMyPayments(user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment history retrieved successfully!',
    data: result,
  });
});

export const PaymentController = {
  createOrderCheckoutSession,
  createSubscriptionCheckoutSession,
  verifyPaymentSession,
  handleStripeWebhook,
  getMyPayments,
};
