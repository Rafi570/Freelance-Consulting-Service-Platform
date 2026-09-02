import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

interface ICreateOrderPayload {
  gigId: string;
  packageId: string;
  requirements?: string;
}

const createOrder = async (clientId: string, payload: ICreateOrderPayload) => {
  // 1. Check if gig exists
  const gig = await prisma.gig.findUnique({
    where: { id: payload.gigId },
    include: {
      packages: true,
      provider: true,
    },
  });

  if (!gig) {
    throw new AppError(404, 'Gig not found.');
  }

  if (gig.status !== 'ACTIVE') {
    throw new AppError(400, 'This gig is currently not accepting new orders.');
  }

  // Prevent ordering own gig
  if (gig.providerId === clientId) {
    throw new AppError(400, 'You cannot purchase your own gig service.');
  }

  // 2. Check if selected package belongs to the gig
  const selectedPackage = gig.packages.find((p) => p.id === payload.packageId);

  if (!selectedPackage) {
    throw new AppError(
      400,
      'The selected package does not exist for this gig.'
    );
  }

  // 3. Create the order
  const order = await prisma.order.create({
    data: {
      clientId,
      gigId: payload.gigId,
      packageId: payload.packageId,
      price: selectedPackage.price,
      requirements: payload.requirements,
      status: 'PENDING',
    },
    include: {
      gig: {
        select: {
          id: true,
          title: true,
          category: true,
          images: true,
          provider: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      package: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return order;
};

const getMyOrders = async (userId: string, role: string) => {
  let whereConditions: any = {};

  if (role === 'CLIENT') {
    whereConditions = { clientId: userId };
  } else if (role === 'PROVIDER') {
    whereConditions = { gig: { providerId: userId } };
  } else if (role === 'SUPER_ADMIN') {
    whereConditions = {};
  }

  const orders = await prisma.order.findMany({
    where: whereConditions,
    orderBy: { createdAt: 'desc' },
    include: {
      gig: {
        select: {
          id: true,
          title: true,
          category: true,
          images: true,
          provider: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      package: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return orders;
};

const getSingleOrder = async (userId: string, role: string, orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      gig: {
        include: {
          provider: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      package: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError(404, 'Order not found.');
  }

  // Authorization check
  const isClient = order.clientId === userId;
  const isProvider = order.gig.providerId === userId;
  const isAdmin = role === 'SUPER_ADMIN';

  if (!isClient && !isProvider && !isAdmin) {
    throw new AppError(403, 'You are not authorized to view this order.');
  }

  return order;
};

const updateOrderStatus = async (
  userId: string,
  role: string,
  orderId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      gig: true,
    },
  });

  if (!order) {
    throw new AppError(404, 'Order not found.');
  }

  const isClient = order.clientId === userId;
  const isProvider = order.gig.providerId === userId;
  const isAdmin = role === 'SUPER_ADMIN';

  if (!isClient && !isProvider && !isAdmin) {
    throw new AppError(403, 'You are not authorized to update this order.');
  }

  // Only provider or admin can mark as IN_PROGRESS or COMPLETED
  if ((status === 'IN_PROGRESS' || status === 'COMPLETED') && !isProvider && !isAdmin) {
    throw new AppError(403, 'Only the service provider can accept or complete an order.');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      gig: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
      package: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updatedOrder;
};

export const OrderService = {
  createOrder,
  getMyOrders,
  getSingleOrder,
  updateOrderStatus,
};
