import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SupportService } from './support.service';

const submitAppeal = catchAsync(async (req: Request, res: Response) => {
  const userContext = (req as any).user;
  const result = await SupportService.submitAppealIntoDB(userContext, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Appeal for unblocking submitted successfully. Admin will review your reason.',
    data: result,
  });
});

const createTicket = catchAsync(async (req: Request, res: Response) => {
  const userContext = (req as any).user;
  const result = await SupportService.createTicketIntoDB(userContext, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Support ticket created successfully!',
    data: result,
  });
});

const checkBlockStatus = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await SupportService.checkBlockStatusFromDB(email);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Account block status and history retrieved successfully.',
    data: result,
  });
});

const getMyTickets = catchAsync(async (req: Request, res: Response) => {
  const userContext = (req as any).user;
  const result = await SupportService.getMyTicketsFromDB(userContext);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My support tickets retrieved successfully.',
    data: result,
  });
});

const getSingleTicket = catchAsync(async (req: Request, res: Response) => {
  const userContext = (req as any).user;
  const ticketId = req.params.id as string;
  const result = await SupportService.getTicketByIdFromDB(userContext, ticketId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Support ticket details and messages retrieved successfully.',
    data: result,
  });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const userContext = (req as any).user;
  const ticketId = req.params.id as string;
  const { message } = req.body;

  const result = await SupportService.sendMessageIntoDB(userContext, ticketId, message);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Message sent successfully.',
    data: result,
  });
});

const getAllTicketsAdmin = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const result = await SupportService.getAllTicketsForAdminFromDB(adminUser, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Support tickets retrieved successfully for admin review.',
    data: result,
  });
});

const reviewTicketAdmin = catchAsync(async (req: Request, res: Response) => {
  const adminUser = (req as any).user;
  const ticketId = req.params.id as string;
  const result = await SupportService.reviewTicketByAdminIntoDB(adminUser, ticketId, req.body);

  const message =
    result.action === 'APPROVE'
      ? 'Appeal approved and provider account has been UNBLOCKED successfully!'
      : result.action === 'REJECT'
      ? 'Appeal has been rejected.'
      : 'Ticket status updated to IN_REVIEW.';

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message,
    data: result,
  });
});

export const SupportController = {
  submitAppeal,
  createTicket,
  checkBlockStatus,
  getMyTickets,
  getSingleTicket,
  sendMessage,
  getAllTicketsAdmin,
  reviewTicketAdmin,
};
