import { UserRole, UserStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

interface IAdminUserContext {
  id: string;
  role: string;
  email: string;
}

const blockUserIntoDB = async (
  adminUser: IAdminUserContext,
  targetId: string,
  status: UserStatus = 'BLOCKED',
  reason?: string
) => {
  // 1. Strict verification: ensure the requesting user is a SUPER_ADMIN
  if (adminUser.role !== 'SUPER_ADMIN') {
    throw new AppError(403, 'Forbidden! Only SUPER_ADMIN is authorized to manage user or provider status.');
  }

  // 2. Find target user by User ID or Provider Profile ID
  const targetUser = await prisma.user.findFirst({
    where: {
      OR: [
        { id: targetId },
        { profile: { id: targetId } },
      ],
    },
    include: {
      profile: true,
    },
  });

  if (!targetUser) {
    throw new AppError(404, 'User or Provider not found with the specified ID.');
  }

  // 3. Security Guard: Prevent Super Admin from modifying themselves
  if (targetUser.id === adminUser.id) {
    throw new AppError(400, 'Super admin cannot change the status of their own account.');
  }

  // 4. Security Guard: Prevent modifying another Super Admin
  if (targetUser.role === UserRole.SUPER_ADMIN) {
    throw new AppError(400, 'Cannot change the status of another SUPER_ADMIN account.');
  }

  const isBlocking = status === 'BLOCKED' || status === 'SUSPENDED';

  // 5. Update user status in database
  const updatedUser = await prisma.user.update({
    where: {
      id: targetUser.id,
    },
    data: {
      status,
      blockReason: isBlocking ? (reason || 'Violation of terms and community guidelines') : null,
      blockedAt: isBlocking ? new Date() : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      blockReason: true,
      blockedAt: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  });

  return updatedUser;
};

const unblockUserIntoDB = async (
  adminUser: IAdminUserContext,
  targetId: string
) => {
  return await blockUserIntoDB(adminUser, targetId, 'ACTIVE');
};

const draftUserIntoDB = async (
  adminUser: IAdminUserContext,
  targetId: string
) => {
  return await blockUserIntoDB(adminUser, targetId, 'DRAFT');
};

const updateUserStatusIntoDB = async (
  adminUser: IAdminUserContext,
  targetId: string,
  status: UserStatus,
  reason?: string
) => {
  return await blockUserIntoDB(adminUser, targetId, status, reason);
};

const getAllUsersFromDB = async (
  adminUser: IAdminUserContext,
  query: Record<string, any>
) => {
  if (adminUser.role !== 'SUPER_ADMIN') {
    throw new AppError(403, 'Forbidden! Only SUPER_ADMIN is authorized to view all users.');
  }

  const { searchTerm, role, status, page = 1, limit = 10 } = query;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const whereConditions: any = {};

  if (searchTerm) {
    whereConditions.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  if (role) {
    whereConditions.role = role as UserRole;
  }

  if (status) {
    whereConditions.status = status as UserStatus;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        blockReason: true,
        blockedAt: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    }),
    prisma.user.count({
      where: whereConditions,
    }),
  ]);

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPage: Math.ceil(total / limitNumber),
    },
    data: users,
  };
};

const getSingleUserFromDB = async (
  adminUser: IAdminUserContext,
  targetId: string
) => {
  if (adminUser.role !== 'SUPER_ADMIN') {
    throw new AppError(403, 'Forbidden! Only SUPER_ADMIN is authorized to view user details.');
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: targetId },
        { profile: { id: targetId } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      blockReason: true,
      blockedAt: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      supportTickets: {
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      },
      gigs: {
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
        },
      },
      orders: {
        select: {
          id: true,
          status: true,
          price: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  return user;
};

export const UserService = {
  blockUserIntoDB,
  unblockUserIntoDB,
  draftUserIntoDB,
  updateUserStatusIntoDB,
  getAllUsersFromDB,
  getSingleUserFromDB,
};

