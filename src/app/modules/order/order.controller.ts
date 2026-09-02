import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { OrderService } from './order.service';

const getCancellationReasons = catchAsync(async (req: Request, res: Response) => {
  const result = OrderService.getCancellationReasons();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Cancellation reasons retrieved successfully!',
    data: result,
  });
});

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await OrderService.createOrder(user.id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Service order placed successfully!',
    data: result,
  });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await OrderService.getMyOrders(user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My orders retrieved successfully!',
    data: result,
  });
});

const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const orderId = req.params.id as string;
  const result = await OrderService.getSingleOrder(user.id, user.role, orderId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order details retrieved successfully!',
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const orderId = req.params.id as string;
  const { status } = req.body;
  const result = await OrderService.updateOrderStatus(
    user.id,
    user.role,
    orderId,
    status
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order status updated successfully!',
    data: result,
  });
});

const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const orderId = req.params.id as string;
  const result = await OrderService.cancelOrder(
    user.id,
    user.role,
    orderId,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order cancelled successfully!',
    data: result,
  });
});

export const OrderController = {
  getCancellationReasons,
  createOrder,
  getMyOrders,
  getSingleOrder,
  updateOrderStatus,
  cancelOrder,
};
