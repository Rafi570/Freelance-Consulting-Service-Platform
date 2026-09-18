import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = Router();

// Register (saves temporarily to Redis and sends EJS email with OTP via Resend)
router.post(
  '/register',
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.registerUser
);

// Verify OTP & Email (creates user in PostgreSQL DB)
router.post(
  '/verify-email',
  validateRequest(AuthValidation.verifyEmailValidationSchema),
  AuthController.verifyEmail
);

// Resend OTP
router.post(
  '/resend-otp',
  validateRequest(AuthValidation.resendOtpValidationSchema),
  AuthController.resendOtp
);

// Login User
router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.loginUser
);

// Google OAuth Login / Register
router.post(
  '/google-login',
  validateRequest(AuthValidation.googleLoginValidationSchema),
  AuthController.googleLogin
);

export const AuthRoutes = router;

