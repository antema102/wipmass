import { Router } from 'express';
import { trackOpen, trackClick } from '../controllers/trackingController';

const router = Router();

// GET /api/track/open/:logId   — Pixel de tracking d'ouverture
router.get('/open/:logId', trackOpen);

// GET /api/track/click/:logId?url=... — Tracking de clic + redirection
router.get('/click/:logId', trackClick);

export default router;
