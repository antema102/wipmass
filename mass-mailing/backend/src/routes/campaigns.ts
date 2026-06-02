import { Router } from 'express';
import {
	sendCampaign,
	getCampaigns,
	getCampaignById,
	getCampaignLogs,
	duplicateCampaign,
	deleteCampaign,
} from '../controllers/campaignController';

const router = Router();

// POST /api/campaigns/send — Lance l'envoi d'une campagne
router.post('/send', sendCampaign);

// GET /api/campaigns — Liste toutes les campagnes
router.get('/', getCampaigns);

// GET /api/campaigns/:id/logs — Logs d'une campagne spécifique
router.get('/:id/logs', getCampaignLogs);

// GET /api/campaigns/:id — Détail d'une campagne
router.get('/:id', getCampaignById);

// POST /api/campaigns/:id/duplicate — Duplique une campagne
router.post('/:id/duplicate', duplicateCampaign);

// DELETE /api/campaigns/:id — Supprime une campagne et ses logs
router.delete('/:id', deleteCampaign);

export default router;
