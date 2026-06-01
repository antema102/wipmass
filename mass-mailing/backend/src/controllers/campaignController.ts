import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { Campaign } from '../models/Campaign';
import { EmailLog } from '../models/EmailLog';
import { mailerService } from '../services/mailerService';

interface SendCampaignBody {
  name: string;
  subject: string;
  htmlBody: string;
  recipients: string[];
}

/**
 * Génère le lien de désabonnement et l'injecte dans le HTML du mail.
 */
const injectUnsubscribeLink = (html: string, token: string): string => {
  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:5000';
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe/${token}`;

  const unsubscribeFooter = `
    <div style="margin-top:30px; padding-top:15px; border-top:1px solid #eee; font-size:11px; color:#999; text-align:center;">
      Vous recevez cet e-mail car vous faites partie de notre liste de contacts.<br/>
      <a href="${unsubscribeUrl}" style="color:#999; text-decoration:underline;">
        Se désabonner de cette liste
      </a>
    </div>
  `;

  // Injecte avant </body> si présent, sinon à la fin
  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeFooter}</body>`);
  }
  return html + unsubscribeFooter;
};

/**
 * POST /api/campaigns/send
 * Crée une campagne et envoie les e-mails en masse.
 */
export const sendCampaign = async (
  req: Request<{}, {}, SendCampaignBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, subject, htmlBody, recipients } = req.body;

    // Validation basique
    if (!subject || !htmlBody || !recipients || recipients.length === 0) {
      res.status(400).json({ success: false, message: 'Champs manquants : subject, htmlBody, recipients.' });
      return;
    }

    // Filtre les emails valides et supprime les doublons
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRecipients = [...new Set(recipients.filter((e) => emailRegex.test(e.trim())))];

    if (validRecipients.length === 0) {
      res.status(400).json({ success: false, message: 'Aucun destinataire valide fourni.' });
      return;
    }

    // Crée la campagne en base
    const campaign = await Campaign.create({
      name: name ?? `Campagne du ${new Date().toLocaleDateString('fr-FR')}`,
      subject,
      htmlBody,
      recipients: validRecipients,
      status: 'sending',
    });

    // Réponse immédiate → l'envoi continue en arrière-plan
    res.status(202).json({
      success: true,
      message: `Campagne "${campaign.name}" lancée pour ${validRecipients.length} destinataire(s).`,
      campaignId: campaign._id,
    });

    // ---- Envoi asynchrone en arrière-plan ----
    let totalSent = 0;
    let totalFailed = 0;

    for (const email of validRecipients) {
      const token = uuidv4();
      const personalizedHtml = injectUnsubscribeLink(htmlBody, token);

      const log = await EmailLog.create({
        campaignId: campaign._id,
        recipient: email,
        subject,
        status: 'pending',
        unsubscribeToken: token,
        sentAt: new Date(),
      });

      try {
        await mailerService.sendMail({
          to: email,
          subject,
          html: personalizedHtml,
        });

        await EmailLog.findByIdAndUpdate(log._id, { status: 'sent' });
        totalSent++;
      } catch (mailError) {
        const message = mailError instanceof Error ? mailError.message : 'Erreur inconnue';
        await EmailLog.findByIdAndUpdate(log._id, { status: 'failed', errorMessage: message });
        totalFailed++;
        console.error(`❌ Échec envoi à ${email} :`, message);
      }

      // Délai anti-spam : 1 à 3 secondes entre chaque mail
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000));
    }

    // Met à jour la campagne une fois terminée
    await Campaign.findByIdAndUpdate(campaign._id, {
      totalSent,
      totalFailed,
      status: 'completed',
      completedAt: new Date(),
    });

    console.log(`✅ Campagne ${campaign._id} terminée : ${totalSent} envoyés, ${totalFailed} échoués.`);
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
