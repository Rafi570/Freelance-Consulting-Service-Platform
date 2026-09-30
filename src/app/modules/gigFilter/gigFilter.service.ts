import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';
import { clearGigsCache } from '../gig/gig.service';

interface ICreateGigFilterPayload {
  name: string;
  label?: string;
  type?: 'CATEGORY' | 'TAG' | 'FEATURED';
  description?: string;
  icon?: string;
  isActive?: boolean;
}

interface IUpdateGigFilterPayload {
  name?: string;
  label?: string;
  type?: 'CATEGORY' | 'TAG' | 'FEATURED';
  description?: string;
  icon?: string;
  isActive?: boolean;
}

const createGigFilterIntoDB = async (
  adminId: string,
  payload: ICreateGigFilterPayload
) => {
  const normalizedName = payload.name.trim();

  // Check for case-insensitive duplicate
  const existingFilter = await prisma.gigFilter.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: 'insensitive',
      },
    },
  });

  if (existingFilter) {
    throw new AppError(
      400,
      `A gig filter named "${normalizedName}" already exists.`
    );
  }

  const result = await prisma.gigFilter.create({
    data: {
      name: normalizedName,
      label: payload.label || normalizedName,
      type: payload.type || 'CATEGORY',
      description: payload.description,
      icon: payload.icon || 'Layers',
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      createdBy: adminId,
    },
  });

  clearGigsCache();
  return result;
};

const getAllGigFiltersFromDB = async (query?: {
  type?: string;
  isActive?: string;
  searchTerm?: string;
}) => {
  const whereConditions: any = {};

  if (query?.type) {
    whereConditions.type = query.type;
  }

  if (query?.isActive !== undefined) {
    whereConditions.isActive = query.isActive === 'true';
  }

  if (query?.searchTerm) {
    whereConditions.OR = [
      { name: { contains: query.searchTerm, mode: 'insensitive' } },
      { label: { contains: query.searchTerm, mode: 'insensitive' } },
      { description: { contains: query.searchTerm, mode: 'insensitive' } },
    ];
  }

  const filters = await prisma.gigFilter.findMany({
    where: whereConditions,
    orderBy: { createdAt: 'desc' },
  });

  // Attach live gig counts for each filter
  const filtersWithCounts = await Promise.all(
    filters.map(async (filter) => {
      const gigCount = await prisma.gig.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { category: { equals: filter.name, mode: 'insensitive' } },
            { tags: { has: filter.name } },
          ],
        },
      });

      return {
        ...filter,
        gigCount,
      };
    })
  );

  return filtersWithCounts;
};

const getSingleGigFilterFromDB = async (id: string) => {
  const filter = await prisma.gigFilter.findUnique({
    where: { id },
  });

  if (!filter) {
    throw new AppError(404, 'Gig filter not found.');
  }

  return filter;
};

const updateGigFilterIntoDB = async (
  id: string,
  payload: IUpdateGigFilterPayload
) => {
  const isExist = await prisma.gigFilter.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new AppError(404, 'Gig filter not found.');
  }

  if (payload.name && payload.name.trim() !== isExist.name) {
    const duplicate = await prisma.gigFilter.findFirst({
      where: {
        name: {
          equals: payload.name.trim(),
          mode: 'insensitive',
        },
        id: { not: id },
      },
    });

    if (duplicate) {
      throw new AppError(
        400,
        `A gig filter named "${payload.name.trim()}" already exists.`
      );
    }
  }

  const result = await prisma.gigFilter.update({
    where: { id },
    data: {
      ...payload,
      name: payload.name ? payload.name.trim() : undefined,
    },
  });

  clearGigsCache();
  return result;
};

const deleteGigFilterFromDB = async (id: string) => {
  const isExist = await prisma.gigFilter.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new AppError(404, 'Gig filter not found.');
  }

  await prisma.gigFilter.delete({
    where: { id },
  });

  clearGigsCache();
  return { message: 'Gig filter deleted successfully!' };
};

export const GigFilterService = {
  createGigFilterIntoDB,
  getAllGigFiltersFromDB,
  getSingleGigFilterFromDB,
  updateGigFilterIntoDB,
  deleteGigFilterFromDB,
};
