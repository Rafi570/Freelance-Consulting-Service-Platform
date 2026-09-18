import { NextFunction, Request, Response, Router } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import { auth, authAllowBlocked } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import prisma from '../../shared/prisma';
import catchAsync from '../../utils/catchAsync';
import { SupportController } from './support.controller';
import { SupportValidation } from './support.validation';

const router = Router();

// Soft/optional auth helper for unblock appeal
const optionalAuthAllowBlocked = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwt.secret as string) as JwtPayload;
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
          });
          if (user) {
            (req as any).user = user;
          }
        } catch {
          // Token invalid, proceed as guest with email in body
        }
      }
    }
    next();
  }
);

// 1. Submit Unblock Appeal (can be called with Bearer Token or Email in body)
router.post(
  '/appeal',
  optionalAuthAllowBlocked,
  validateRequest(SupportValidation.createAppealValidationSchema),
  SupportController.submitAppeal
);

// 2. Check why user/provider is blocked & their appeal status by email
router.post(
  '/check-status',
  validateRequest(SupportValidation.checkBlockStatusValidationSchema),
  SupportController.checkBlockStatus
);

// 3. Create General Support Ticket (Authenticated - including BLOCKED users)
router.post(
  '/tickets',
  authAllowBlocked('PROVIDER', 'CLIENT', 'SUPER_ADMIN'),
  validateRequest(SupportValidation.createTicketValidationSchema),
  SupportController.createTicket
);

// 4. Get My Support Tickets (Provider / Client)
router.get(
  '/my-tickets',
  authAllowBlocked('PROVIDER', 'CLIENT', 'SUPER_ADMIN'),
  SupportController.getMyTickets
);

// 5. Get Single Support Ticket with full conversation
router.get(
  '/tickets/:id',
  authAllowBlocked('PROVIDER', 'CLIENT', 'SUPER_ADMIN'),
  SupportController.getSingleTicket
);

// 6. Send Message / Reply in Support Ticket
router.post(
  '/tickets/:id/messages',
  authAllowBlocked('PROVIDER', 'CLIENT', 'SUPER_ADMIN'),
  validateRequest(SupportValidation.sendMessageValidationSchema),
  SupportController.sendMessage
);

// --- SUPER_ADMIN Support Management & Appeal Review ---
// 7. Get All Support Tickets (Admin)
router.get(
  '/admin/tickets',
  auth('SUPER_ADMIN'),
  SupportController.getAllTicketsAdmin
);

// 8. Get Single Support Ticket Details (Admin)
router.get(
  '/admin/tickets/:id',
  auth('SUPER_ADMIN'),
  SupportController.getSingleTicket
);

// 9. Admin Reply to Support Ticket / Appeal
router.post(
  '/admin/tickets/:id/messages',
  auth('SUPER_ADMIN'),
  validateRequest(SupportValidation.sendMessageValidationSchema),
  SupportController.sendMessage
);

// 10. Admin Review Appeal & Automatically Unblock Provider (Approve / Reject)
router.patch(
  '/admin/tickets/:id/review',
  auth('SUPER_ADMIN'),
  validateRequest(SupportValidation.reviewAppealValidationSchema),
  SupportController.reviewTicketAdmin
);

export const SupportRoutes = router;
