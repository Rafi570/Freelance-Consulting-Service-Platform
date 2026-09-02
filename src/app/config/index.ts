import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || 10,
  jwt: {
    secret: process.env.JWT_ACCESS_SECRET || 'fallback_secret_key',
    expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '7d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  email: {
    resend_api_key: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'Freelance Platform <onboarding@resend.dev>',
    smtp_user: process.env.EMAIL_USER || process.env.SMTP_USER || '',
    smtp_pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || '',
  },
  otp: {
    expires_in_seconds: Number(process.env.OTP_EXPIRATION_SECONDS) || 300, // 5 minutes default
  },
  stripe: {
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secret_key: process.env.STRIPE_SECRET_KEY || '',
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || '',
    success_url:
      process.env.STRIPE_SUCCESS_URL ||
      'http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url:
      process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/payment/cancel',
    subscription_fee: 15.0, // $15 for provider premium subscription
  },
};
