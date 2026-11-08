import { Router } from 'express';
import { DomainsController } from './domains.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Public Caddy On-Demand TLS handshake ask hook (must precede authenticated routes)
router.get('/caddy-ask', DomainsController.caddyAsk);

router.use(requireAuth);

router.post('/', DomainsController.createDomain);
router.get('/', DomainsController.listDomains);
router.get('/:id', DomainsController.getDomain);
router.post('/:id/verify', DomainsController.verifyDomain);
router.patch('/:id', DomainsController.updateDomain);
router.delete('/:id', DomainsController.deleteDomain);

export default router;
