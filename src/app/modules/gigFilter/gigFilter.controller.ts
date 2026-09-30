import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { GigFilterService } from './gigFilter.service';

const createGigFilter = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const result = await GigFilterService.createGigFilterIntoDB(
    adminUser.id,
    req.body
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Gig filter created successfully!',
    data: result,
  });
});

const getAllGigFilters = catchAsync(async (req: Request, res: Response) => {
  const result = await GigFilterService.getAllGigFiltersFromDB(
    req.query as any
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Gig filters retrieved successfully!',
    data: result,
  });
});

const getSingleGigFilter = catchAsync(async (req: Request, res: Response) => {
  const result = await GigFilterService.getSingleGigFilterFromDB(
    req.params.id as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Gig filter retrieved successfully!',
    data: result,
  });
});

const updateGigFilter = catchAsync(async (req: Request, res: Response) => {
  const result = await GigFilterService.updateGigFilterIntoDB(
    req.params.id as string,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Gig filter updated successfully!',
    data: result,
  });
});

const deleteGigFilter = catchAsync(async (req: Request, res: Response) => {
  const result = await GigFilterService.deleteGigFilterFromDB(
    req.params.id as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Gig filter deleted successfully!',
    data: result,
  });
});

export const GigFilterController = {
  createGigFilter,
  getAllGigFilters,
  getSingleGigFilter,
  updateGigFilter,
  deleteGigFilter,
};
