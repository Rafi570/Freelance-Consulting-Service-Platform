import prisma from '../../shared/prisma';
import AppError from '../../errors/AppError';
import { OrderStatus } from '@prisma/client';

// Helper to generate last 7 days bar chart data
const generateLast7DaysChart = async (whereClause: any) => {
  const data = [];
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    
    const count = await prisma.order.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: d,
          lte: end,
        }
      }
    });
    
    data.push({
      day: days[d.getDay()],
      height: count > 0 ? Math.min(100, Math.max(10, count * 20)) : 5
    });
  }
  return data;
};

// Helper to get recent projects (orders)
const getRecentProjects = async (whereClause: any) => {
  const orders = await prisma.order.findMany({
    where: whereClause,
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      gig: { select: { title: true } },
      client: { select: { name: true } },
    }
  });

  return orders.map((o) => {
    let completion = 0;
    if (o.status === 'COMPLETED') completion = 100;
    else if (o.status === 'IN_PROGRESS') completion = 50;
    else if (o.status === 'CANCELLED') completion = 0;
    else completion = 10; // PENDING

    return {
      id: o.id,
      name: o.gig.title,
      category: o.client.name, // using category field for client name
      iconLetter: o.gig.title.substring(0, 2).toUpperCase(),
      budget: o.price,
      completion,
      status: o.status
    };
  });
};

// Helper to get timeline
const getTimeline = async (whereClause: any) => {
  const orders = await prisma.order.findMany({
    where: whereClause,
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((o) => ({
    id: o.id,
    title: `Order #${o.id.substring(0, 6).toUpperCase()} ${o.status.toLowerCase()}`,
    time: o.createdAt.toISOString(),
    status: o.status,
  }));
};

const getDashboardStats = async (userId: string, role: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (role === 'SUPER_ADMIN') {
    const todaysPayments = await prisma.payment.aggregate({
      where: { status: 'PAID', createdAt: { gte: today } },
      _sum: { amount: true },
    });
    const todaysUsers = await prisma.user.count({ where: { createdAt: { gte: today } } });
    const totalGigs = await prisma.gig.count({ where: { status: 'ACTIVE' } });
    const totalSalesPayments = await prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    });

    return {
      stats: {
        stat1: todaysPayments._sum.amount || 0,
        stat2: todaysUsers,
        stat3: totalGigs,
        stat4: totalSalesPayments._sum.amount || 0,
      },
      barChart: await generateLast7DaysChart({}),
      projects: await getRecentProjects({}),
      timeline: await getTimeline({}),
    };
  }

  if (role === 'PROVIDER') {
    const todaysOrders = await prisma.order.findMany({
      where: { gig: { providerId: userId }, paymentStatus: 'PAID', createdAt: { gte: today } },
      select: { price: true },
    });
    const stat1 = todaysOrders.reduce((sum, order) => sum + order.price, 0);

    const clients = await prisma.order.findMany({
      where: { gig: { providerId: userId } },
      select: { clientId: true },
      distinct: ['clientId'],
    });
    const stat2 = clients.length;

    const stat3 = await prisma.gig.count({ where: { providerId: userId } });

    const allOrders = await prisma.order.findMany({
      where: { gig: { providerId: userId }, paymentStatus: 'PAID' },
      select: { price: true },
    });
    const stat4 = allOrders.reduce((sum, order) => sum + order.price, 0);

    return {
      stats: { stat1, stat2, stat3, stat4 },
      barChart: await generateLast7DaysChart({ gig: { providerId: userId } }),
      projects: await getRecentProjects({ gig: { providerId: userId } }),
      timeline: await getTimeline({ gig: { providerId: userId } }),
    };
  }

  if (role === 'CLIENT') {
    const spentOrders = await prisma.order.aggregate({
      where: { clientId: userId, paymentStatus: 'PAID' },
      _sum: { price: true },
    });
    const activeOrders = await prisma.order.count({
      where: { clientId: userId, status: 'IN_PROGRESS' },
    });
    const totalOrders = await prisma.order.count({ where: { clientId: userId } });
    const completedOrders = await prisma.order.count({
      where: { clientId: userId, status: 'COMPLETED' },
    });

    return {
      stats: {
        stat1: spentOrders._sum.price || 0,
        stat2: activeOrders,
        stat3: totalOrders,
        stat4: completedOrders,
      },
      barChart: await generateLast7DaysChart({ clientId: userId }),
      projects: await getRecentProjects({ clientId: userId }),
      timeline: await getTimeline({ clientId: userId }),
    };
  }

  throw new AppError(400, 'Invalid role for dashboard stats');
};

export const DashboardService = {
  getDashboardStats,
};
