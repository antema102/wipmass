import cron from 'node-cron';
import { Campaign } from '../models/Campaign';
import { processCampaignSend } from './sendService';
import { logger } from '../utils/logger';

/**
 * Démarre le planificateur de campagnes.
 * Vérifie toutes les minutes les campagnes dont le statut est 'scheduled'
 * et dont la date scheduledAt est passée, puis déclenche l'envoi.
 */
export const startScheduler = (): void => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const dueCampaigns = await Campaign.find({
        status: 'scheduled',
        scheduledAt: { $lte: now },
      });

      if (dueCampaigns.length === 0) return;

      logger.info(`📅 Scheduler : ${dueCampaigns.length} campagne(s) à envoyer.`);

      for (const campaign of dueCampaigns) {
        // Passe immédiatement en "sending" pour éviter un double déclenchement
        await Campaign.findByIdAndUpdate(campaign._id, { status: 'sending' });

        processCampaignSend((campaign._id as string).toString()).catch((err) => {
          logger.error(`Erreur scheduler — campagne ${campaign._id}`, err);
        });
      }
    } catch (err) {
      logger.error('Erreur dans le scheduler', err);
    }
  });

  logger.info('📅 Scheduler démarré (vérification toutes les minutes).');
};
