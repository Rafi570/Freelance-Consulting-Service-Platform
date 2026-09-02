import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { GigRoutes } from '../modules/gig/gig.routes';
import { OrderRoutes } from '../modules/order/order.routes';
import { ProviderRoutes } from '../modules/provider/provider.routes';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
