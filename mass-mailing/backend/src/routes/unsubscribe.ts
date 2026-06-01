import { Router } from 'express';
import { unsubscribeByToken } from '../controllers/unsubscribeController';

const router = Router();

// GET /api/unsubscribe/:token — Désabonnement via lien unique
router.get('/:token', unsubscribeByToken);

export default router;
