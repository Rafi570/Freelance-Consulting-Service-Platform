import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.routes';
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
