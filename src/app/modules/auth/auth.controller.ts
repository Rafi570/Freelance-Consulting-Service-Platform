import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AuthService } from './auth.service';

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: {
      email: result.email,
    },
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyEmail(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Email verified and user account created successfully!',
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resendOtp(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: {
      email: result.email,
    },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully!',
    data: result,
  });
});

export const AuthController = {
  registerUser,
  verifyEmail,
  resendOtp,
  loginUser,
};
