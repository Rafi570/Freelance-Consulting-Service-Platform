import { Router } from 'express';
import auth from '../../middlewares/auth';
import { DashboardController } from './dashboard.controller';

const router = Router();

router.get(
  '/stats',
  auth('SUPER_ADMIN', 'PROVIDER', 'CLIENT'),
  DashboardController.getDashboardStats
);

export const DashboardRoutes = router;
