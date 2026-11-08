import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { LinksController } from './links.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Throttle anonymous public link creation to stop bot spam floods
const publicLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many public link creation attempts from this IP. Please try again later or sign up.',
    },
  },
});

// Public unauthenticated route (rate-limited to 1 per IP)
router.post('/public', publicLinkLimiter, LinksController.createAnonymousLink);

// Authenticated routes
router.use(requireAuth);

router.post('/claim', LinksController.claimLinks);
router.get('/quota', LinksController.getUserQuota);
router.post('/', LinksController.createLink);
router.get('/', LinksController.listLinks);
router.get('/:id', LinksController.getLink);
router.patch('/:id', LinksController.updateLink);
router.delete('/:id', LinksController.deleteLink);

export default router;
