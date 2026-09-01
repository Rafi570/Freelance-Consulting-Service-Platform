import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

const loginUser = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
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
  loginUser,
};
