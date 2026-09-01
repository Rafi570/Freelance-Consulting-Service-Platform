import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ProviderService } from './provider.service';

const createProvider = catchAsync(async (req: Request, res: Response) => {
  const result = await ProviderService.createProviderIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Provider account created successfully!',
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ProviderService.getMyProfileFromDB(user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Provider profile retrieved successfully!',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await ProviderService.updateProviderProfileIntoDB(user.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Provider profile updated successfully!',
    data: result,
  });
});

const getAllProviders = catchAsync(async (req: Request, res: Response) => {
  console.log('getAllProviders query:', req.query);
  const result = await ProviderService.getAllProvidersFromDB(req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Providers retrieved successfully!',
    data: result,
  });
});

const getSingleProvider = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await ProviderService.getSingleProviderFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Provider retrieved successfully!',
    data: result,
  });
});

export const ProviderController = {
  createProvider,
  getMyProfile,
  updateMyProfile,
  getAllProviders,
  getSingleProvider,
};
