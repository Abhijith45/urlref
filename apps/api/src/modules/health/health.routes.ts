import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();

// Allow cross-origin wake-up pings and health checks from any client/probe
router.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Request-Id');
  next();
});

router.get('/', HealthController.getLiveness);
router.get('/health', HealthController.getLiveness);
router.get('/ready', HealthController.getReadiness);

export default router;
