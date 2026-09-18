import { TicketCategory, TicketStatus, UserRole, UserStatus } from '@prisma/client';
import AppError from '../../errors/AppError';
import prisma from '../../shared/prisma';

interface IUserContext {
  id: string;
  role: string;
  email: string;
}

interface ISubmitAppealPayload {
  email?: string;
  subject?: string;
  message: string;
}

interface ICreateTicketPayload {
  subject: string;
  category?: TicketCategory;
  message: string;
}

interface IReviewAppealPayload {
  action: 'APPROVE' | 'REJECT' | 'IN_REVIEW';
  adminNotes?: string;
}

// 1. Submit Appeal for Unblocking (supports both authenticated or email lookup)
const submitAppealIntoDB = async (
  userContext: IUserContext | undefined,
  payload: ISubmitAppealPayload
) => {
  let targetUserId = userContext?.id;

  if (!targetUserId) {
    if (!payload.email) {
      throw new AppError(400, 'Please provide your registered account email or authenticate with token.');
    }
    const normalizedEmail = payload.email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!existingUser) {
      throw new AppError(404, 'No account found with the provided email address.');
    }
    targetUserId = existingUser.id;
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { profile: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  // Create appeal ticket and initial message using transaction
  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        userId: user.id,
        subject: payload.subject || 'Appeal for Account Unblocking',
        category: TicketCategory.BLOCK_APPEAL,
        message: payload.message,
        status: TicketStatus.PENDING,
      },
    });

    const initialMessage = await tx.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: user.id,
        senderRole: user.role,
        message: payload.message,
      },
    });

    return {
      ticket,
      initialMessage,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        blockReason: user.blockReason,
        blockedAt: user.blockedAt,
      },
    };
  });

  return result;
};

// 2. Create General Support Ticket
const createTicketIntoDB = async (
  userContext: IUserContext,
  payload: ICreateTicketPayload
) => {
  const user = await prisma.user.findUnique({
    where: { id: userContext.id },
  });

  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        userId: user.id,
        subject: payload.subject,
        category: payload.category || TicketCategory.GENERAL,
        message: payload.message,
        status: TicketStatus.PENDING,
      },
    });

    await tx.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: user.id,
        senderRole: user.role,
        message: payload.message,
      },
    });

    return ticket;
  });

  return result;
};

// 3. Public Check Block Reason & Appeal Status by Email
const checkBlockStatusFromDB = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      blockReason: true,
      blockedAt: true,
      supportTickets: {
        where: { category: TicketCategory.BLOCK_APPEAL },
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'No account found with this email address.');
  }

  return user;
};

// 4. Get My Support Tickets (Provider / User)
const getMyTicketsFromDB = async (userContext: IUserContext) => {
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: userContext.id },
    orderBy: { createdAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return tickets;
};

// 5. Get Single Ticket by ID
const getTicketByIdFromDB = async (userContext: IUserContext, ticketId: string) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          blockReason: true,
          blockedAt: true,
          profile: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!ticket) {
    throw new AppError(404, 'Support ticket not found.');
  }

  if (userContext.role !== UserRole.SUPER_ADMIN && ticket.userId !== userContext.id) {
    throw new AppError(403, 'Forbidden! You can only view your own support tickets.');
  }

  return ticket;
};

// 6. Send Message / Reply in Ticket Conversation
const sendMessageIntoDB = async (
  userContext: IUserContext,
  ticketId: string,
  messageText: string
) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: true },
  });

  if (!ticket) {
    throw new AppError(404, 'Support ticket not found.');
  }

  if (userContext.role !== UserRole.SUPER_ADMIN && ticket.userId !== userContext.id) {
    throw new AppError(403, 'Forbidden! You can only send messages on your own support tickets.');
  }

  const newMessage = await prisma.$transaction(async (tx) => {
    const msg = await tx.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userContext.id,
        senderRole: userContext.role as UserRole,
        message: messageText,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Update ticket status to IN_REVIEW if user replied
    if (userContext.role !== UserRole.SUPER_ADMIN && ticket.status === TicketStatus.PENDING) {
      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.IN_REVIEW },
      });
    }

    return msg;
  });

  return newMessage;
};

// 7. Get All Support Tickets for Admin
const getAllTicketsForAdminFromDB = async (
  adminUser: IUserContext,
  query: Record<string, any>
) => {
  if (adminUser.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, 'Forbidden! Only SUPER_ADMIN can view all support tickets.');
  }

  const { searchTerm, status, category, page = 1, limit = 10 } = query;
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const skip = (pageNumber - 1) * limitNumber;

  const whereConditions: any = {};

  if (searchTerm) {
    whereConditions.OR = [
      { subject: { contains: searchTerm, mode: 'insensitive' } },
      { message: { contains: searchTerm, mode: 'insensitive' } },
      { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
      { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
    ];
  }

  if (status) {
    whereConditions.status = status as TicketStatus;
  }

  if (category) {
    whereConditions.category = category as TicketCategory;
  }

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where: whereConditions,
      skip,
      take: limitNumber,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            blockReason: true,
            blockedAt: true,
            profile: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    }),
    prisma.supportTicket.count({
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
    data: tickets,
  };
};

// 8. Review Ticket / Appeal by Admin (Approve = Unblock Provider, Reject = Keep Blocked)
const reviewTicketByAdminIntoDB = async (
  adminUser: IUserContext,
  ticketId: string,
  payload: IReviewAppealPayload
) => {
  if (adminUser.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(403, 'Forbidden! Only SUPER_ADMIN can review support tickets.');
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: true },
  });

  if (!ticket) {
    throw new AppError(404, 'Support ticket not found.');
  }

  const result = await prisma.$transaction(async (tx) => {
    let updatedUser = ticket.user;

    // If APPROVE, unblock the user if they were blocked or suspended
    if (payload.action === 'APPROVE') {
      updatedUser = await tx.user.update({
        where: { id: ticket.userId },
        data: {
          status: UserStatus.ACTIVE,
          blockReason: null,
          blockedAt: null,
        },
      });

      // Add automated system/admin message
      await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: adminUser.id,
          senderRole: UserRole.SUPER_ADMIN,
          message: `[SUPER ADMIN RESOLUTION]: Appeal approved! Note: "${payload.adminNotes || 'Valid reason accepted.'}". Your account has been unblocked and restored to ACTIVE status.`,
        },
      });
    } else if (payload.action === 'REJECT') {
      // Add rejection note message
      await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: adminUser.id,
          senderRole: UserRole.SUPER_ADMIN,
          message: `[SUPER ADMIN RESOLUTION]: Appeal rejected. Note: "${payload.adminNotes || 'Reason provided was not sufficient to unblock the account.'}".`,
        },
      });
    }

    const ticketNewStatus =
      payload.action === 'APPROVE'
        ? TicketStatus.RESOLVED
        : payload.action === 'REJECT'
        ? TicketStatus.REJECTED
        : TicketStatus.IN_REVIEW;

    const updatedTicket = await tx.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: ticketNewStatus,
        adminNotes: payload.adminNotes || null,
        reviewedBy: adminUser.email,
        resolvedAt: payload.action !== 'IN_REVIEW' ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            blockReason: true,
            blockedAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return {
      ticket: updatedTicket,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        blockReason: updatedUser.blockReason,
      },
      action: payload.action,
      isUnblocked: payload.action === 'APPROVE',
    };
  });

  return result;
};

export const SupportService = {
  submitAppealIntoDB,
  createTicketIntoDB,
  checkBlockStatusFromDB,
  getMyTicketsFromDB,
  getTicketByIdFromDB,
  sendMessageIntoDB,
  getAllTicketsForAdminFromDB,
  reviewTicketByAdminIntoDB,
};
