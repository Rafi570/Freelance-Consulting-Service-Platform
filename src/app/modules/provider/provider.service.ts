import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../../config';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

interface ICreateProviderPayload {
  name: string;
  email: string;
  password: string;
  bio?: string;
  skills?: string[];
  phone?: string;
  address?: string;
  experience?: string;
  portfolioUrl?: string;
  hourlyRate?: number;
}

interface IUpdateProviderPayload {
  name?: string;
  bio?: string;
  skills?: string[];
  phone?: string;
  address?: string;
  experience?: string;
  portfolioUrl?: string;
  hourlyRate?: number;
}

const createProviderIntoDB = async (payload: ICreateProviderPayload) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isUserExist) {
    throw new AppError(400, 'A user already exists with this email address.');
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds)
  );

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
        role: 'PROVIDER',
      },
    });

    const newProfile = await tx.providerProfile.create({
      data: {
        userId: newUser.id,
        bio: payload.bio,
        skills: payload.skills || [],
        phone: payload.phone,
        address: payload.address,
        experience: payload.experience,
        portfolioUrl: payload.portfolioUrl,
        hourlyRate: payload.hourlyRate,
      },
    });

    return {
      ...newUser,
      profile: newProfile,
    };
  });

  // Generate JWT access token
  const jwtPayload = {
    id: result.id,
    email: result.email,
    role: result.role,
  };

  const accessToken = jwt.sign(jwtPayload, config.jwt.secret as string, {
    expiresIn: config.jwt.expires_in,
  } as jwt.SignOptions);

  const { password, ...providerData } = result;

  return {
    accessToken,
    provider: providerData,
  };
};

const getMyProfileFromDB = async (userId: string) => {
  const provider = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  });

  if (!provider) {
    throw new AppError(404, 'Provider profile not found.');
  }

  return provider;
};

const updateProviderProfileIntoDB = async (
  userId: string,
  payload: IUpdateProviderPayload
) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      profile: true,
    },
  });

  if (!isUserExist) {
    throw new AppError(404, 'Provider account not found.');
  }

  const { name, ...profileData } = payload;

  const result = await prisma.$transaction(async (tx) => {
    if (name) {
      await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          name,
        },
      });
    }

    if (Object.keys(profileData).length > 0) {
      await tx.providerProfile.upsert({
        where: {
          userId,
        },
        create: {
          userId,
          ...profileData,
        },
        update: {
          ...profileData,
        },
      });
    }

    return await tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });
  });

  return result;
};

const getAllProvidersFromDB = async (query: Record<string, any>) => {
  const { searchTerm, skill, page = 1, limit = 10 } = query;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const whereConditions: any = {
    role: 'PROVIDER',
    status: 'ACTIVE',
  };

  if (searchTerm) {
    const matchingProfiles = await prisma.providerProfile.findMany({
      where: {
        OR: [
          { bio: { contains: searchTerm, mode: 'insensitive' } },
          { skills: { has: searchTerm } },
        ],
      },
      select: { userId: true },
    });

    const profileUserIds = matchingProfiles.map((p) => p.userId);

    whereConditions.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
      { id: { in: profileUserIds } },
    ];
  }

  if (skill) {
    const matchingSkillProfiles = await prisma.providerProfile.findMany({
      where: { skills: { has: skill } },
      select: { userId: true },
    });
    const skillUserIds = matchingSkillProfiles.map((p) => p.userId);
    whereConditions.id = { in: skillUserIds };
  }

  const [providers, total] = await Promise.all([
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
        createdAt: true,
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
    data: providers,
  };
};

const getSingleProviderFromDB = async (id: string) => {
  const provider = await prisma.user.findFirst({
    where: {
      id,
      role: 'PROVIDER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      profile: true,
    },
  });

  if (!provider) {
    throw new AppError(404, 'Provider not found.');
  }

  return provider;
};

export const ProviderService = {
  createProviderIntoDB,
  getMyProfileFromDB,
  updateProviderProfileIntoDB,
  getAllProvidersFromDB,
  getSingleProviderFromDB,
};
