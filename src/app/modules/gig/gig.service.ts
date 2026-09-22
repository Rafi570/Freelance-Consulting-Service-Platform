import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

interface IPackagePayload {
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM';
  name: string;
  description: string;
  price: number;
  deliveryTimeInDays: number;
  revisions?: number;
  features?: string[];
}

interface ICreateGigPayload {
  title: string;
  description: string;
  category: string;
  tags?: string[];
  images?: string[];
  packages: IPackagePayload[];
}

interface IUpdateGigPayload {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  images?: string[];
  status?: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  packages?: IPackagePayload[];
}

const createGig = async (providerId: string, payload: ICreateGigPayload) => {
  // 1. Verify provider profile and subscription status
  const provider = await prisma.user.findUnique({
    where: { id: providerId },
    include: { profile: true },
  });

  if (!provider || provider.role !== 'PROVIDER') {
    throw new AppError(403, 'Only registered service providers can create gigs.');
  }

  if (provider.status !== 'ACTIVE') {
    throw new AppError(
      403,
      `Cannot publish gigs when account status is ${provider.status}. Only ACTIVE providers can publish gigs.`
    );
  }

  // 2. Enforce 4-Gig Limit for Free Providers
  const currentGigCount = await prisma.gig.count({
    where: { providerId },
  });

  const isSubscribed = provider.profile?.isSubscribed ?? false;

  if (currentGigCount >= 4 && !isSubscribed) {
    throw new AppError(
      403,
      `Free tier limit reached! You have already created ${currentGigCount} gigs (maximum allowed is 4 for free accounts). Please upgrade to a Premium Subscription to publish unlimited gigs.`
    );
  }

  // 3. Create Gig with its 3 packages using a Prisma transaction
  const result = await prisma.$transaction(async (tx) => {
    const newGig = await tx.gig.create({
      data: {
        providerId,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        tags: payload.tags || [],
        images: payload.images || [],
        packages: {
          create: payload.packages.map((pkg) => ({
            tier: pkg.tier,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            deliveryTimeInDays: pkg.deliveryTimeInDays,
            revisions: pkg.revisions ?? 1,
            features: pkg.features || [],
          })),
        },
      },
      include: {
        packages: {
          orderBy: {
            price: 'asc',
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
    });

    return newGig;
  });

  return result;
};

const getAllGigs = async (query: Record<string, any>) => {
  const {
    searchTerm,
    category,
    tag,
    minPrice,
    maxPrice,
    status = 'ACTIVE',
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const whereConditions: any = {
    status: status as any,
    provider: {
      status: 'ACTIVE',
    },
  };

  if (searchTerm) {
    whereConditions.OR = [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { category: { contains: searchTerm, mode: 'insensitive' } },
      { tags: { has: searchTerm } },
    ];
  }

  if (category) {
    whereConditions.category = { equals: category, mode: 'insensitive' };
  }

  if (tag) {
    whereConditions.tags = { has: tag };
  }

  // Price range filter on packages
  if (minPrice || maxPrice) {
    const priceCondition: any = {};
    if (minPrice) priceCondition.gte = Number(minPrice);
    if (maxPrice) priceCondition.lte = Number(maxPrice);

    whereConditions.packages = {
      some: {
        price: priceCondition,
      },
    };
  }

  const [gigs, total] = await Promise.all([
    prisma.gig.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: {
        [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc',
      },
      include: {
        packages: {
          orderBy: {
            price: 'asc',
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            orders: {
              where: { status: 'COMPLETED' },
            },
            reviews: true,
          },
        },
      },
    }),
    prisma.gig.count({
      where: whereConditions,
    }),
  ]);

  const formattedGigs = gigs.map((gig) => {
    const totalSold = gig._count?.orders ?? 0;
    const totalReviews = gig.reviews.length;
    const averageRating =
      totalReviews > 0
        ? parseFloat(
            (
              gig.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
            ).toFixed(1)
          )
        : 0;

    const { reviews, ...restGig } = gig;

    return {
      ...restGig,
      totalSold,
      totalReviews,
      averageRating,
    };
  });

  return {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPage: Math.ceil(total / limitNumber),
    },
    data: formattedGigs,
  };
};

const getSingleGig = async (id: string) => {
  const gig = await prisma.gig.findUnique({
    where: { id },
    include: {
      packages: {
        orderBy: {
          price: 'asc',
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
        },
      },
      reviews: {
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          orders: {
            where: { status: 'COMPLETED' },
          },
          reviews: true,
        },
      },
    },
  });

  if (!gig) {
    throw new AppError(404, 'Gig not found.');
  }

  const totalSold = gig._count?.orders ?? 0;
  const totalReviews = gig.reviews.length;
  const averageRating =
    totalReviews > 0
      ? parseFloat(
          (
            gig.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
          ).toFixed(1)
        )
      : 0;

  return {
    ...gig,
    totalSold,
    totalReviews,
    averageRating,
  };
};

const getMyGigs = async (providerId: string) => {
  const [gigs, provider] = await Promise.all([
    prisma.gig.findMany({
      where: { providerId },
      include: {
        packages: {
          orderBy: {
            price: 'asc',
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            orders: {
              where: { status: 'COMPLETED' },
            },
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.findUnique({
      where: { id: providerId },
      include: { profile: true },
    }),
  ]);

  const isSubscribed = provider?.profile?.isSubscribed ?? false;

  const formattedGigs = gigs.map((gig) => {
    const totalSold = gig._count?.orders ?? 0;
    const totalReviews = gig.reviews.length;
    const averageRating =
      totalReviews > 0
        ? parseFloat(
            (
              gig.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
            ).toFixed(1)
          )
        : 0;

    const { reviews, ...restGig } = gig;

    return {
      ...restGig,
      totalSold,
      totalReviews,
      averageRating,
    };
  });

  return {
    isSubscribed,
    gigLimit: isSubscribed ? 'Unlimited' : 4,
    totalCreated: formattedGigs.length,
    remainingFreeGigs: isSubscribed ? 'Unlimited' : Math.max(0, 4 - formattedGigs.length),
    gigs: formattedGigs,
  };
};

const updateGig = async (
  providerId: string,
  gigId: string,
  payload: IUpdateGigPayload
) => {
  const isGigExist = await prisma.gig.findUnique({
    where: { id: gigId },
  });

  if (!isGigExist) {
    throw new AppError(404, 'Gig not found.');
  }

  if (isGigExist.providerId !== providerId) {
    throw new AppError(403, 'You are not authorized to edit this gig.');
  }

  const { packages, ...gigData } = payload;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update basic gig fields
    if (Object.keys(gigData).length > 0) {
      await tx.gig.update({
        where: { id: gigId },
        data: gigData,
      });
    }

    // 2. Update individual packages if provided
    if (packages && packages.length > 0) {
      for (const pkg of packages) {
        await tx.gigPackage.upsert({
          where: {
            gigId_tier: {
              gigId,
              tier: pkg.tier,
            },
          },
          update: {
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            deliveryTimeInDays: pkg.deliveryTimeInDays,
            revisions: pkg.revisions,
            features: pkg.features,
          },
          create: {
            gigId,
            tier: pkg.tier,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            deliveryTimeInDays: pkg.deliveryTimeInDays,
            revisions: pkg.revisions ?? 1,
            features: pkg.features || [],
          },
        });
      }
    }

    return await tx.gig.findUnique({
      where: { id: gigId },
      include: {
        packages: {
          orderBy: { price: 'asc' },
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
      },
    });
  });

  return result;
};

const deleteGig = async (
  userId: string,
  role: string,
  gigId: string
) => {
  const isGigExist = await prisma.gig.findUnique({
    where: { id: gigId },
  });

  if (!isGigExist) {
    throw new AppError(404, 'Gig not found.');
  }

  if (role !== 'SUPER_ADMIN' && isGigExist.providerId !== userId) {
    throw new AppError(403, 'You are not authorized to delete this gig.');
  }

  await prisma.gig.delete({
    where: { id: gigId },
  });

  return { message: 'Gig deleted successfully!' };
};

const toggleGigStatus = async (
  providerId: string,
  gigId: string,
  specificStatus?: 'ACTIVE' | 'PAUSED' | 'DRAFT'
) => {
  const isGigExist = await prisma.gig.findUnique({
    where: { id: gigId },
  });

  if (!isGigExist) {
    throw new AppError(404, 'Gig not found.');
  }

  if (isGigExist.providerId !== providerId) {
    throw new AppError(403, 'You are not authorized to toggle this gig.');
  }

  const nextStatus =
    specificStatus || (isGigExist.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');

  const updatedGig = await prisma.gig.update({
    where: { id: gigId },
    data: { status: nextStatus },
    include: {
      packages: {
        orderBy: { price: 'asc' },
      },
    },
  });

  return {
    message: `Gig successfully ${
      nextStatus === 'ACTIVE' ? 'activated (enabled)' : 'paused (disabled)'
    }!`,
    gig: updatedGig,
  };
};

const getGigCategories = async () => {
  // 1. Fetch distinct active categories from the database
  const dbGigs = await prisma.gig.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: {
      category: true,
    },
    distinct: ['category'],
  });

  const dbCategories = dbGigs
    .map((g) => g.category?.trim())
    .filter((cat): cat is string => Boolean(cat));

  // 2. Comprehensive marketplace default categories for full coverage
  const defaultCategories = [
    'Graphics & Design',
    'Programming & Tech',
    'Digital Marketing',
    'Video & Animation',
    'Writing & Translation',
    'Business & Consulting',
    'AI Services',
    'Finance & Accounting',
  ];

  // 3. Deduplicate preserving active DB categories first
  const categorySet = new Set<string>();
  dbCategories.forEach((c) => categorySet.add(c));
  defaultCategories.forEach((c) => categorySet.add(c));

  // 4. Count active gigs per category
  const categoryCounts = await prisma.gig.groupBy({
    by: ['category'],
    where: {
      status: 'ACTIVE',
    },
    _count: {
      id: true,
    },
  });

  const countMap = new Map<string, number>();
  categoryCounts.forEach((item) => {
    countMap.set(item.category, item._count.id);
  });

  return Array.from(categorySet).map((name) => ({
    name,
    count: countMap.get(name) || 0,
  }));
};

export const GigService = {
  createGig,
  getAllGigs,
  getSingleGig,
  getGigCategories,
  getMyGigs,
  updateGig,
  toggleGigStatus,
  deleteGig,
};

