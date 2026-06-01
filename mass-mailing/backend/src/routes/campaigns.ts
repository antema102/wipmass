import { Router } from 'express';
import { sendCampaign, getCampaigns, getCampaignLogs } from '../controllers/campaignController';

const router = Router();

// POST /api/campaigns/send — Lance l'envoi d'une campagne
router.post('/send', sendCampaign);

// GET /api/campaigns — Liste toutes les campagnes
router.get('/', getCampaigns);

// GET /api/campaigns/:id/logs — Logs d'une campagne spécifique
router.get('/:id/logs', getCampaignLogs);

export default router;
