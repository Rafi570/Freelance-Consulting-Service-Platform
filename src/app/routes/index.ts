import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { GigRoutes } from '../modules/gig/gig.routes';
import { OrderRoutes } from '../modules/order/order.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { ProviderRoutes } from '../modules/provider/provider.routes';
import { ReviewRoutes } from '../modules/review/review.routes';
import { SupportRoutes } from '../modules/support/support.routes';
import { UserRoutes } from '../modules/user/user.routes';
import { GigFilterRoutes } from '../modules/gigFilter/gigFilter.routes';
import { DashboardRoutes } from '../modules/dashboard/dashboard.routes';

const router = Router();

const moduleRoutes = [
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/admin/users',
    route: UserRoutes,
  },
  {
    path: '/providers',
    route: ProviderRoutes,
  },
  {
    path: '/gigs',
    route: GigRoutes,
  },
  {
    path: '/gig-filters',
    route: GigFilterRoutes,
  },
  {
    path: '/orders',
    route: OrderRoutes,
  },
  {
    path: '/payments',
    route: PaymentRoutes,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
  {
    path: '/support',
    route: SupportRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
