import { v4 as uuidv4 } from 'uuid';
import { Campaign } from '../models/Campaign';
import { EmailLog } from '../models/EmailLog';
import { Contact } from '../models/Contact';
import { mailerService } from './mailerService';
import {
  injectUnsubscribeLink,
  injectTrackingPixel,
  injectClickTracking,
} from '../utils/emailTracker';
import { logger } from '../utils/logger';

// ─── Configuration depuis .env ────────────────────────────────────────────────
const BATCH_SIZE    = parseInt(process.env.BATCH_SIZE    ?? '20', 10);
const BATCH_DELAY   = parseInt(process.env.BATCH_DELAY_MS  ?? '3000', 10);
const EMAIL_DELAY   = parseInt(process.env.EMAIL_DELAY_MS  ?? '800', 10);
const MAX_RETRIES   = parseInt(process.env.MAX_RETRIES     ?? '3', 10);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Envoie tous les e-mails d'une campagne en arrière-plan.
 * - Filtre les contacts désabonnés
 * - Traitement par batch
 * - Retry x3 avec backoff exponentiel
 * - Injection automatique : tracking pixel, click tracking, lien désabonnement
 */
export const processCampaignSend = async (campaignId: string): Promise<void> => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    logger.error(`processCampaignSend : campagne ${campaignId} introuvable.`);
    return;
  }

  const { subject, htmlBody, recipients } = campaign;
  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:5000';
  const normalizedRecipients = recipients.map((email) => email.trim().toLowerCase());
  const uniqueRecipients = [...new Set(normalizedRecipients)];
  
  // ── Filtre les contacts désabonnés ──────────────────────────────────────
  const unsubscribedContacts = await Contact.find(
    { email: { $in: uniqueRecipients }, isUnsubscribed: true },
    { email: 1 }
  );
  const unsubscribedLogs = await EmailLog.find(
    {
      recipient: { $in: uniqueRecipients },
      unsubscribedAt: { $ne: null },
    },
    { recipient: 1 }
  );

  const unsubscribedEmails = new Set([
    ...unsubscribedContacts.map((c) => c.email),
    ...unsubscribedLogs.map((l) => l.recipient),
  ]);
  const filteredRecipients = uniqueRecipients.filter((email) => !unsubscribedEmails.has(email));
  const skippedCount = uniqueRecipients.length - filteredRecipients.length;

  if (skippedCount > 0) {
    logger.info(`⏭️  ${skippedCount} destinataire(s) désabonné(s) ignoré(s)`);
  }

  const totalRecipients = filteredRecipients.length;
  if (totalRecipients === 0) {
    logger.warn(`⚠️  Aucun destinataire valide pour la campagne "${campaign.name}"`);
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'completed',
      completedAt: new Date(),
    });
    return;
  }

  logger.info(`🚀 Envoi campagne "${campaign.name}" → ${totalRecipients} destinataire(s) (${skippedCount} désabonné(s)) | batch=${BATCH_SIZE}`);

  let totalSent   = 0;
  let totalFailed = 0;

  // ── Traitement par batch ──────────────────────────────────────────────────
  for (let batchStart = 0; batchStart < totalRecipients; batchStart += BATCH_SIZE) {
    const batch       = filteredRecipients.slice(batchStart, batchStart + BATCH_SIZE);
    const batchNum    = Math.floor(batchStart / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalRecipients / BATCH_SIZE);

    logger.info(`📦 Batch ${batchNum}/${totalBatches} — ${batch.length} e-mails`);

    for (const email of batch) {
      const token = uuidv4();

      // Crée le log en base (status = pending)
      const log = await EmailLog.create({
        campaignId: campaign._id,
        recipient: email,
        subject,
        status: 'pending',
        unsubscribeToken: token,
        sentAt: new Date(),
      });

      // Prépare le HTML personnalisé
      let html = injectUnsubscribeLink(htmlBody, token, baseUrl);
      html     = injectTrackingPixel(html, (log._id as string).toString(), baseUrl);
      html     = injectClickTracking(html, (log._id as string).toString(), baseUrl);

      // ── Retry avec backoff exponentiel ──────────────────────────────────
      let sent      = false;
      let lastError = '';

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          await mailerService.sendMail({ to: email, subject, html });
          await EmailLog.findByIdAndUpdate(log._id, { status: 'sent' });
          totalSent++;
          sent = true;
          break;
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Erreur inconnue';
          logger.warn(`⚠️  Tentative ${attempt}/${MAX_RETRIES} échouée (${email}) : ${lastError}`);
          if (attempt < MAX_RETRIES) await delay(attempt * 2000); // 2s, 4s
        }
      }

      if (!sent) {
        await EmailLog.findByIdAndUpdate(log._id, { status: 'failed', errorMessage: lastError });
        totalFailed++;
        logger.error(`❌ Échec définitif pour ${email}`, new Error(lastError));
      }

      // Délai anti-spam entre chaque e-mail
      await delay(EMAIL_DELAY);
    }

    // Pause entre les batches (sauf après le dernier)
    if (batchStart + BATCH_SIZE < totalRecipients) {
      logger.info(`⏸️  Pause inter-batch (${BATCH_DELAY}ms)…`);
      await delay(BATCH_DELAY);
    }
  }

  // ── Mise à jour finale de la campagne ─────────────────────────────────────
  await Campaign.findByIdAndUpdate(campaignId, {
    totalSent,
    totalFailed,
    status: 'completed',
    completedAt: new Date(),
  });

  logger.success(
    `✅ Campagne "${campaign.name}" terminée — ${totalSent} envoyé(s), ${totalFailed} échoué(s).`
  );
};
