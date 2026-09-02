import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { GigService } from './gig.service';

const createGig = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await GigService.createGig(user.id, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Gig with 3 packages created successfully!',
    data: result,
  });
});

const getAllGigs = catchAsync(async (req: Request, res: Response) => {
  const result = await GigService.getAllGigs(req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Gigs retrieved successfully!',
    data: result,
  });
});

const getSingleGig = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await GigService.getSingleGig(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Gig retrieved successfully!',
    data: result,
  });
});

const getMyGigs = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await GigService.getMyGigs(user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My gigs retrieved successfully!',
    data: result,
  });
});

const updateGig = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = req.params.id as string;
  const result = await GigService.updateGig(user.id, id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Gig updated successfully!',
    data: result,
  });
});

const toggleGigStatus = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = req.params.id as string;
  const { status } = req.body || {};
  const result = await GigService.toggleGigStatus(user.id, id, status);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result.gig,
  });
});

const deleteGig = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const id = req.params.id as string;
  const result = await GigService.deleteGig(user.id, user.role, id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: null,
  });
});

export const GigController = {
  createGig,
  getAllGigs,
  getSingleGig,
  getMyGigs,
  updateGig,
  toggleGigStatus,
  deleteGig,
};
