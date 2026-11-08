import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Dashboard overview across all links owned by the user
router.get('/overview', requireAuth, AnalyticsController.getDashboardOverview);

// Link-specific analytics
router.get('/:id', requireAuth, AnalyticsController.getLinkAnalytics);

export const analyticsRouter = router;
