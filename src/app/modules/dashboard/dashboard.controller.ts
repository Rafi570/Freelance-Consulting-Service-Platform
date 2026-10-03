import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { DashboardService } from './dashboard.service';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await DashboardService.getDashboardStats(user.id, user.role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard stats retrieved successfully!',
    data: result,
  });
});

export const DashboardController = {
  getDashboardStats,
};
