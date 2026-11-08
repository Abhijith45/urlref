import { Router } from 'express';
import { RedirectController } from './redirects.controller';

const router = Router();

// Public stateless redirect route
router.get('/:code', RedirectController.handleRedirect);

export default router;
