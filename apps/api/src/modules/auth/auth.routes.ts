import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Strict rate-limiting on auth endpoints to prevent Argon2id CPU/RAM exhaustion DoS and credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
});

router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.me);

export default router;
