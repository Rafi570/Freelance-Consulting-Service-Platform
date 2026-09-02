import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';
import redisClient from '../../shared/redis';
import { sendVerificationEmail } from '../../utils/sendEmail';

interface IRegisterUserPayload {
  name: string;
  email: string;
  password: string;
  role?: 'PROVIDER' | 'CLIENT';
  bio?: string;
  skills?: string[];
  phone?: string;
  address?: string;
  experience?: string;
  portfolioUrl?: string;
  hourlyRate?: number;
}

const registerUser = async (payload: IRegisterUserPayload) => {
  const normalizedEmail = payload.email.toLowerCase().trim();

  // 1. Check if user already exists in PostgreSQL database
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (isUserExist) {
    throw new AppError(400, 'A user already exists with this email address.');
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds)
  );

  // 3. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 4. Store user registration data in Redis with TTL (Do NOT write to DB yet!)
  const redisKey = `pending_user:${normalizedEmail}`;
  const pendingData = {
    ...payload,
    email: normalizedEmail,
    password: hashedPassword,
    otp,
  };

  const ttlSeconds = config.otp.expires_in_seconds || 300;
  await redisClient.set(redisKey, JSON.stringify(pendingData), 'EX', ttlSeconds);

  // 5. Send verification email using EJS template and Resend
  await sendVerificationEmail({
    to: normalizedEmail,
    name: payload.name,
    otp,
    expireMinutes: Math.ceil(ttlSeconds / 60),
  });

  return {
    email: normalizedEmail,
    message: `Verification OTP has been sent to ${normalizedEmail}. Please verify your email within ${Math.ceil(
      ttlSeconds / 60
    )} minutes to complete registration.`,
  };
};

const verifyEmail = async (payload: { email: string; otp: string }) => {
  const normalizedEmail = payload.email.toLowerCase().trim();
  const redisKey = `pending_user:${normalizedEmail}`;

  // 1. Check pending registration in Redis
  const cachedDataStr = await redisClient.get(redisKey);
  if (!cachedDataStr) {
    throw new AppError(
      400,
      'OTP has expired or no pending registration found. Please register again.'
    );
  }

  const cachedData = JSON.parse(cachedDataStr);

  // 2. Validate OTP
  if (cachedData.otp !== payload.otp) {
    throw new AppError(400, 'Invalid OTP code. Please check and try again.');
  }

  // Double check if user was created in the meantime
  const isUserExist = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (isUserExist) {
    await redisClient.del(redisKey);
    throw new AppError(400, 'A user with this email is already registered.');
  }

  // 3. Persist to PostgreSQL database using transaction
  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: cachedData.name,
        email: cachedData.email,
        password: cachedData.password,
        role: cachedData.role || 'PROVIDER',
      },
    });

    let profile = null;
    if (newUser.role === 'PROVIDER') {
      profile = await tx.providerProfile.create({
        data: {
          userId: newUser.id,
          bio: cachedData.bio,
          skills: cachedData.skills || [],
          phone: cachedData.phone,
          address: cachedData.address,
          experience: cachedData.experience,
          portfolioUrl: cachedData.portfolioUrl,
          hourlyRate: cachedData.hourlyRate,
        },
      });
    }

    return {
      ...newUser,
      profile,
    };
  });

  // 4. Remove pending data from Redis
  await redisClient.del(redisKey);

  // 5. Generate JWT token
  const jwtPayload = {
    id: result.id,
    email: result.email,
    role: result.role,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt.secret as string, {
    expiresIn: config.jwt.expires_in,
  } as jwt.SignOptions);

  const { password, ...userWithoutPassword } = result;

  return {
    accessToken,
    user: userWithoutPassword,
  };
};

const resendOtp = async (payload: { email: string }) => {
  const normalizedEmail = payload.email.toLowerCase().trim();
  const redisKey = `pending_user:${normalizedEmail}`;

  const cachedDataStr = await redisClient.get(redisKey);
  if (!cachedDataStr) {
    throw new AppError(
      404,
      'No pending registration found for this email address or it has expired. Please register again.'
    );
  }

  const cachedData = JSON.parse(cachedDataStr);
  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

  cachedData.otp = newOtp;
  const ttlSeconds = config.otp.expires_in_seconds || 300;
  await redisClient.set(redisKey, JSON.stringify(cachedData), 'EX', ttlSeconds);

  await sendVerificationEmail({
    to: normalizedEmail,
    name: cachedData.name,
    otp: newOtp,
    expireMinutes: Math.ceil(ttlSeconds / 60),
  });

  return {
    email: normalizedEmail,
    message: `A new verification OTP has been sent to ${normalizedEmail}.`,
  };
};

const loginUser = async (payload: { email: string; password: string }) => {
  const normalizedEmail = payload.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
    include: {
      profile: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'User does not exist with this email.');
  }

  if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
    throw new AppError(403, `User account is ${user.status.toLowerCase()}.`);
  }

  const isPasswordMatched = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatched) {
    throw new AppError(401, 'Invalid credentials! Password does not match.');
  }

  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt.secret as string, {
    expiresIn: config.jwt.expires_in,
  } as jwt.SignOptions);

  const { password, ...userWithoutPassword } = user;

  return {
    accessToken,
    user: userWithoutPassword,
  };
};

export const AuthService = {
  registerUser,
  verifyEmail,
  resendOtp,
  loginUser,
};
