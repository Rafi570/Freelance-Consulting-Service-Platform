import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const targetId = req.params.id as string;
  const status = req.body?.status || 'BLOCKED';

  const result = await UserService.blockUserIntoDB(adminUser, targetId, status);

  const actionText =
    status === 'BLOCKED'
      ? 'blocked'
      : status === 'ACTIVE'
      ? 'activated'
      : status === 'DRAFT'
      ? 'moved to draft'
      : 'suspended';

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `${result.role === 'PROVIDER' ? 'Provider' : 'User'} ${actionText} successfully!`,
    data: result,
  });
});

const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const targetId = req.params.id as string;

  const result = await UserService.unblockUserIntoDB(adminUser, targetId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `${result.role === 'PROVIDER' ? 'Provider' : 'User'} unblocked (activated) successfully!`,
    data: result,
  });
});

const draftUser = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const targetId = req.params.id as string;

  const result = await UserService.draftUserIntoDB(adminUser, targetId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `${result.role === 'PROVIDER' ? 'Provider' : 'User'} set to DRAFT status successfully!`,
    data: result,
  });
});

const activateUser = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const targetId = req.params.id as string;

  const result = await UserService.unblockUserIntoDB(adminUser, targetId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `${result.role === 'PROVIDER' ? 'Provider' : 'User'} activated successfully!`,
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const targetId = req.params.id as string;
  const { status } = req.body;

  const result = await UserService.updateUserStatusIntoDB(adminUser, targetId, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `${result.role === 'PROVIDER' ? 'Provider' : 'User'} status updated to ${status} successfully!`,
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const result = await UserService.getAllUsersFromDB(adminUser, req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully!',
    data: result,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const targetId = req.params.id as string;
  const result = await UserService.getSingleUserFromDB(adminUser, targetId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User details retrieved successfully!',
    data: result,
  });
});

export const UserController = {
  blockUser,
  unblockUser,
  draftUser,
  activateUser,
  updateUserStatus,
  getAllUsers,
  getSingleUser,
};
