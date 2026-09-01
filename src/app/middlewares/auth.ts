import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../config';
import AppError from '../errors/AppError';
import prisma from '../shared/prisma';
import catchAsync from '../utils/catchAsync';

const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError(401, 'You are not authorized! No token provided.');
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      throw new AppError(401, 'You are not authorized! Invalid token format.');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret as string) as JwtPayload;
    } catch {
      throw new AppError(401, 'Invalid or expired token.');
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      throw new AppError(404, 'User associated with this token not found.');
    }

    if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
      throw new AppError(403, `Your account is ${user.status.toLowerCase()}.`);
    }

    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new AppError(403, 'You do not have permission to access this resource.');
    }

    // Attach user to req
    (req as any).user = user;
    next();
  });
};

export default auth;
