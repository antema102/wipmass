import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Campaign } from '../models/Campaign';
import { EmailLog } from '../models/EmailLog';
import { processCampaignSend } from '../services/sendService';

interface SendCampaignBody {
  name: string;
  subject: string;
  htmlBody: string;
  recipients: string[];
  scheduledAt?: string; // ISO date string (ex: "2026-06-05T14:30:00Z")
}

/**
 * POST /api/campaigns/send
 * Crée une campagne et envoie les e-mails en masse ou les planifie.
 */
export const sendCampaign = async (
  req: Request<{}, {}, SendCampaignBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, subject, htmlBody, recipients, scheduledAt } = req.body;

    // Validation basique
    if (!subject || !htmlBody || !recipients || recipients.length === 0) {
      res.status(400).json({ success: false, message: 'Champs manquants : subject, htmlBody, recipients.' });
      return;
    }

    // Filtre les emails valides, normalise en lowercase et supprime les doublons
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRecipients = [
      ...new Set(
        recipients
          .map((e) => e.trim().toLowerCase())
          .filter((e) => emailRegex.test(e))
      ),
    ];

    if (validRecipients.length === 0) {
      res.status(400).json({ success: false, message: 'Aucun destinataire valide fourni.' });
      return;
    }

    // Vérifie et valide la date de planification si fournie
    let status = 'sending';
    let scheduleDate: Date | undefined;

    if (scheduledAt) {
      const parsedDate = new Date(scheduledAt);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ success: false, message: 'Format de date invalide. Utilisez ISO 8601 (ex: 2026-06-05T14:30:00Z).' });
        return;
      }

      const now = new Date();
      if (parsedDate <= now) {
        res.status(400).json({ success: false, message: 'La date de planification doit être dans le futur.' });
        return;
      }

      status = 'scheduled';
      scheduleDate = parsedDate;
    }

    // Crée la campagne en base
    const campaign = await Campaign.create({
      name: name ?? `Campagne du ${new Date().toLocaleDateString('fr-FR')}`,
      subject,
      htmlBody,
      recipients: validRecipients,
      status,
      scheduledAt: scheduleDate,
    });

    // Réponse
    const message =
      status === 'scheduled'
        ? `Campagne "${campaign.name}" planifiée pour ${scheduleDate!.toLocaleString('fr-FR')}.`
        : `Campagne "${campaign.name}" lancée pour ${validRecipients.length} destinataire(s).`;

    res.status(status === 'scheduled' ? 201 : 202).json({
      success: true,
      message,
      campaignId: campaign._id,
      status,
    });

    // ---- Envoi asynchrone en arrière-plan (seulement si non planifiée) ----
    if (status === 'sending') {
      processCampaignSend((campaign._id as any).toString()).catch((err) => {
        console.error(`Erreur lors de l'envoi de la campagne ${campaign._id}:`, err);
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/campaigns
 * Retourne la liste de toutes les campagnes avec statistiques.
 */
export const getCampaigns = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/campaigns/:id
 * Retourne une campagne spécifique.
 */
export const getCampaignById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'ID de campagne invalide.' });
      return;
    }

    const campaign = await Campaign.findById(id).lean();
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
      return;
    }

    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/campaigns/:id/logs
 * Retourne les logs détaillés d'une campagne.
 */
export const getCampaignLogs = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'ID de campagne invalide.' });
      return;
    }

    const logs = await EmailLog.find({ campaignId: id })
      .sort({ sentAt: -1 })
      .lean();

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/campaigns/:id/duplicate
 * Duplique une campagne existante (utile pour réutiliser les modèles).
 */
export const duplicateCampaign = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'ID de campagne invalide.' });
      return;
    }

    const originalCampaign = await Campaign.findById(id);
    if (!originalCampaign) {
      res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
      return;
    }

    // Duplique la campagne avec un nouveau nom et statut "draft"
    const duplicatedCampaign = await Campaign.create({
      name: `${originalCampaign.name} (copie)`,
      subject: originalCampaign.subject,
      htmlBody: originalCampaign.htmlBody,
      recipients: [...originalCampaign.recipients],
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      message: `Campagne dupliquée avec succès.`,
      data: duplicatedCampaign,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/campaigns/:id
 * Supprime une campagne et tous ses logs associés.
 */
export const deleteCampaign = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'ID de campagne invalide.' });
      return;
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      res.status(404).json({ success: false, message: 'Campagne non trouvée.' });
      return;
    }

    // Supprime les logs associés puis la campagne
    await EmailLog.deleteMany({ campaignId: id });
    await campaign.deleteOne();

    res.json({ success: true, message: `Campagne "${campaign.name}" et ses logs supprimés.` });
  } catch (error) {
    next(error);
  }
};
