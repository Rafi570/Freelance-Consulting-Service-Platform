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

// High-performance in-memory cache
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const gigsCache = new Map<string, CacheEntry<any>>();

export const clearGigsCache = () => {
  gigsCache.clear();
};

const createGig = async (providerId: string, payload: ICreateGigPayload) => {
  // 1. Verify provider profile and subscription status
  const provider = await prisma.user.findUnique({
    where: { id: providerId },
    include: { profile: true },
  });

  if (!provider || (provider.role !== 'PROVIDER' && provider.role !== 'SUPER_ADMIN')) {
    throw new AppError(403, 'Only registered service providers and administrators can create gigs.');
  }

  if (provider.status !== 'ACTIVE') {
    throw new AppError(
      403,
      `Cannot publish gigs when account status is ${provider.status}. Only ACTIVE providers can publish gigs.`
    );
  }

  // 2. Enforce 4-Gig Limit for Free Providers (Super Admin has unlimited)
  const currentGigCount = await prisma.gig.count({
    where: { providerId },
  });

  const isSubscribed = provider.role === 'SUPER_ADMIN' ? true : (provider.profile?.isSubscribed ?? false);

  if (provider.role !== 'SUPER_ADMIN' && currentGigCount >= 4 && !isSubscribed) {
    throw new AppError(
      403,
      `Free tier limit reached! You have already created ${currentGigCount} gigs (maximum allowed is 4 for free accounts). Please upgrade to a Premium Subscription to publish unlimited gigs.`
    );
  }

  // 2b. Strictly validate that category exists in active gig filters created by Super Admin
  const validCategory = await prisma.gigFilter.findFirst({
    where: {
      name: { equals: payload.category.trim(), mode: 'insensitive' },
      type: 'CATEGORY',
      isActive: true,
    },
  });

  if (!validCategory) {
    throw new AppError(
      400,
      `Category "${payload.category}" is not an active category approved by Super Admin. Providers can only choose categories created by Admin.`
    );
  }

  const canonicalCategoryName = validCategory.name;

  // 3. Create Gig with its 3 packages using a Prisma transaction
  const result = await prisma.$transaction(async (tx) => {
    const newGig = await tx.gig.create({
      data: {
        providerId,
        title: payload.title,
        description: payload.description,
        category: canonicalCategoryName,
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

  clearGigsCache();
  return result;
};

const getAllGigs = async (query: Record<string, any>) => {
  const cacheKey = `gigs:${JSON.stringify(query)}`;
  const cached = gigsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

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
    provider: {
      status: 'ACTIVE',
    },
  };

  if (status && status !== 'ALL' && status !== 'all') {
    whereConditions.status = status as any;
  }

  if (query.providerId) {
    whereConditions.providerId = query.providerId;
  }

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

  let orderByClause: any = { createdAt: 'desc' };
  if (
    sortBy === 'orders' ||
    sortBy === 'totalSold' ||
    sortBy === 'popular' ||
    sortBy === 'most_ordered'
  ) {
    orderByClause = {
      orders: {
        _count: sortOrder === 'asc' ? 'asc' : 'desc',
      },
    };
  } else if (
    sortBy === 'title' ||
    sortBy === 'category' ||
    sortBy === 'createdAt' ||
    sortBy === 'updatedAt'
  ) {
    orderByClause = {
      [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
    };
  }

  const [gigs, total] = await Promise.all([
    prisma.gig.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: orderByClause,
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
              where: {
                status: {
                  in: ['COMPLETED', 'IN_PROGRESS', 'PENDING'],
                },
              },
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

  let formattedGigs = gigs.map((gig) => {
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

  // Post-query fallback sorting to guarantee order-count and price sorting precision
  if (
    sortBy === 'orders' ||
    sortBy === 'totalSold' ||
    sortBy === 'popular' ||
    sortBy === 'most_ordered'
  ) {
    formattedGigs.sort((a, b) =>
      sortOrder === 'asc' ? a.totalSold - b.totalSold : b.totalSold - a.totalSold
    );
  } else if (sortBy === 'rating') {
    formattedGigs.sort((a, b) =>
      sortOrder === 'asc' ? a.averageRating - b.averageRating : b.averageRating - a.averageRating
    );
  } else if (sortBy === 'price_asc') {
    formattedGigs.sort((a, b) => {
      const minA = a.packages?.[0]?.price ?? 0;
      const minB = b.packages?.[0]?.price ?? 0;
      return minA - minB;
    });
  } else if (sortBy === 'price_desc') {
    formattedGigs.sort((a, b) => {
      const minA = a.packages?.[0]?.price ?? 0;
      const minB = b.packages?.[0]?.price ?? 0;
      return minB - minA;
    });
  }

  const responseData = {
    meta: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPage: Math.ceil(total / limitNumber),
    },
    data: formattedGigs,
  };

  gigsCache.set(cacheKey, {
    data: responseData,
    expiresAt: Date.now() + 60 * 1000,
  });

  return responseData;
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

const getMyGigs = async (providerId: string, role?: string) => {
  const whereCondition: any = { providerId };
  const [gigs, provider] = await Promise.all([
    prisma.gig.findMany({
      where: whereCondition,
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
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.findUnique({
      where: { id: providerId },
      include: { profile: true },
    }),
  ]);

  const isSubscribed = role === 'SUPER_ADMIN' ? true : (provider?.profile?.isSubscribed ?? false);

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
  userId: string,
  userRole: string,
  gigId: string,
  payload: IUpdateGigPayload
) => {
  const isGigExist = await prisma.gig.findUnique({
    where: { id: gigId },
  });

  if (!isGigExist) {
    throw new AppError(404, 'Gig not found.');
  }

  if (userRole !== 'SUPER_ADMIN' && isGigExist.providerId !== userId) {
    throw new AppError(403, 'You are not authorized to edit this gig.');
  }

  const { packages, ...gigData } = payload;

  if (gigData.category) {
    const validCategory = await prisma.gigFilter.findFirst({
      where: {
        name: { equals: gigData.category.trim(), mode: 'insensitive' },
        type: 'CATEGORY',
        isActive: true,
      },
    });

    if (!validCategory) {
      throw new AppError(
        400,
        `Category "${gigData.category}" is not an active category approved by Super Admin.`
      );
    }
    gigData.category = validCategory.name;
  }

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

  clearGigsCache();
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

  clearGigsCache();
  return { message: 'Gig deleted successfully!' };
};

const toggleGigStatus = async (
  userId: string,
  userRole: string,
  gigId: string,
  specificStatus?: 'ACTIVE' | 'PAUSED' | 'DRAFT'
) => {
  const isGigExist = await prisma.gig.findUnique({
    where: { id: gigId },
  });

  if (!isGigExist) {
    throw new AppError(404, 'Gig not found.');
  }

  if (userRole !== 'SUPER_ADMIN' && isGigExist.providerId !== userId) {
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

  clearGigsCache();
  return {
    message: `Gig successfully ${
      nextStatus === 'ACTIVE' ? 'activated (enabled)' : 'paused (disabled)'
    }!`,
    gig: updatedGig,
  };
};

const getGigCategories = async () => {
  const cacheKey = 'gigs:categories';
  const cached = gigsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // 1. Fetch ONLY active categories created by Super Admin in gig_filters
  const adminFilters = await prisma.gigFilter.findMany({
    where: {
      type: 'CATEGORY',
      isActive: true,
    },
    select: { name: true, label: true },
    orderBy: { createdAt: 'desc' },
  });

  const categoryNames = adminFilters.map((f) => f.name.trim());

  // 2. Count active gigs per category
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
    countMap.set(item.category.toLowerCase(), item._count.id);
  });

  const categoriesResult = categoryNames.map((name) => ({
    name,
    count: countMap.get(name.toLowerCase()) || 0,
  }));

  gigsCache.set(cacheKey, {
    data: categoriesResult,
    expiresAt: Date.now() + 5 * 1000,
  });

  return categoriesResult;
};

const getSearchSuggestions = async (searchTerm?: string) => {
  const query = (searchTerm || '').trim();

  if (query.length > 0) {
    const matchingGigs = await prisma.gig.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      select: {
        id: true,
        title: true,
        category: true,
        tags: true,
      },
      take: 10,
    });

    const suggestions: Array<{
      text: string;
      category: string;
      type: 'service' | 'category' | 'tag';
      id?: string;
    }> = [];

    const seenTexts = new Set<string>();

    // 1. Add matching categories
    matchingGigs.forEach((gig) => {
      if (
        gig.category &&
        gig.category.toLowerCase().includes(query.toLowerCase()) &&
        !seenTexts.has(gig.category.toLowerCase())
      ) {
        seenTexts.add(gig.category.toLowerCase());
        suggestions.push({
          text: gig.category,
          category: gig.category,
          type: 'category',
        });
      }
    });

    // 2. Add matching tags
    matchingGigs.forEach((gig) => {
      if (Array.isArray(gig.tags)) {
        gig.tags.forEach((tag) => {
          if (
            tag.toLowerCase().includes(query.toLowerCase()) &&
            !seenTexts.has(tag.toLowerCase())
          ) {
            seenTexts.add(tag.toLowerCase());
            suggestions.push({
              text: tag,
              category: gig.category,
              type: 'tag',
            });
          }
        });
      }
    });

    // 3. Add matching gig titles
    matchingGigs.forEach((gig) => {
      if (!seenTexts.has(gig.title.toLowerCase())) {
        seenTexts.add(gig.title.toLowerCase());
        suggestions.push({
          text: gig.title,
          category: gig.category,
          type: 'service',
          id: gig.id,
        });
      }
    });

    return suggestions.slice(0, 8);
  }

  // If query is empty, return popular tags, popular categories and featured gigs
  const popularGigs = await prisma.gig.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      title: true,
      category: true,
      tags: true,
    },
    take: 12,
  });

  const popularTagsSet = new Set<string>();
  const popularCategoriesSet = new Set<string>();

  popularGigs.forEach((g) => {
    if (g.category) popularCategoriesSet.add(g.category);
    if (Array.isArray(g.tags)) {
      g.tags.forEach((t) => popularTagsSet.add(t));
    }
  });

  // Supply fallback tags if tags array is sparse
  const fallbackTags = [
    'Website Design',
    'Logo Design',
    'Web Development',
    'AI Services',
    'Digital Marketing',
    'Business Strategy',
  ];
  fallbackTags.forEach((t) => popularTagsSet.add(t));

  return {
    popularSearches: Array.from(popularTagsSet).slice(0, 6),
    popularCategories: Array.from(popularCategoriesSet).slice(0, 6),
    featuredGigs: popularGigs.slice(0, 4).map((g) => ({
      id: g.id,
      text: g.title,
      category: g.category,
      type: 'service' as const,
    })),
  };
};

const getHeroData = async () => {
  const cacheKey = 'gigs:hero-data';
  const cached = gigsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // 1. Fetch categories
  const categories = await getGigCategories();

  // 2. Fetch distinct active tags from database
  const activeGigs = await prisma.gig.findMany({
    where: { status: 'ACTIVE' },
    select: {
      tags: true,
      category: true,
      title: true,
    },
    take: 30,
  });

  const allTags = new Set<string>();
  activeGigs.forEach((g) => {
    if (Array.isArray(g.tags)) {
      g.tags.forEach((tag) => {
        if (tag && tag.trim()) allTags.add(tag.trim());
      });
    }
  });

  // Default fallbacks if database tags are few
  const defaultPopularTags = [
    'Website Design',
    'Logo & Branding',
    'SEO & Marketing',
    'Web & App Dev',
    'AI Services',
    'Business Strategy',
    'Video Editing',
  ];
  defaultPopularTags.forEach((t) => allTags.add(t));

  const popularTags = Array.from(allTags).slice(0, 6).map((tag) => ({
    label: tag,
    query: tag,
  }));

  // 3. Platform stats for hero
  const [totalTalent, totalActiveGigs, totalCompletedOrders] = await Promise.all([
    prisma.user.count({ where: { role: 'PROVIDER', status: 'ACTIVE' } }),
    prisma.gig.count({ where: { status: 'ACTIVE' } }),
    prisma.order.count({ where: { status: 'COMPLETED' } }),
  ]);

  const heroData = {
    popularTags,
    categories: categories.slice(0, 8),
    stats: {
      totalTalent: Math.max(totalTalent, 12),
      totalGigs: Math.max(totalActiveGigs, 8),
      completedOrders: Math.max(totalCompletedOrders, 158),
    },
  };

  gigsCache.set(cacheKey, {
    data: heroData,
    expiresAt: Date.now() + 60 * 1000, // 1 min cache
  });

  return heroData;
};

export const GigService = {
  createGig,
  getAllGigs,
  getSingleGig,
  getGigCategories,
  getSearchSuggestions,
  getHeroData,
  getMyGigs,
  updateGig,
  toggleGigStatus,
  deleteGig,
};


