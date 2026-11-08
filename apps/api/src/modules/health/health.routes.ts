import { Router } from 'express';
import { HealthController } from './health.controller';

const router = Router();

router.get('/', HealthController.getLiveness);
router.get('/health', HealthController.getLiveness);
router.get('/ready', HealthController.getReadiness);

export default router;
