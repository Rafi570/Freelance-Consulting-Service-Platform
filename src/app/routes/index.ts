import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { GigRoutes } from '../modules/gig/gig.routes';
import { OrderRoutes } from '../modules/order/order.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { ProviderRoutes } from '../modules/provider/provider.routes';
import { ReviewRoutes } from '../modules/review/review.routes';
import { UserRoutes } from '../modules/user/user.routes';

const router = Router();

const moduleRoutes = [
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
