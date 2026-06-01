import { Request, Response, NextFunction } from 'express';
import { EmailLog } from '../models/EmailLog';
import { Campaign } from '../models/Campaign';

/**
 * GET /api/unsubscribe/:token
 * Traite la demande de désabonnement via le token unique.
 */
export const unsubscribeByToken = async (
  req: Request<{ token: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;

    const log = await EmailLog.findOne({ unsubscribeToken: token });

    if (!log) {
      res.status(404).send(renderPage('❌ Lien invalide', 'Ce lien de désabonnement est invalide ou a déjà expiré.', false));
      return;
    }

    if (log.unsubscribedAt) {
      res.send(renderPage('ℹ️ Déjà désabonné', `L'adresse <strong>${log.recipient}</strong> est déjà désabonnée.`, true));
      return;
    }

    // Marque l'e-mail comme désabonné
    log.unsubscribedAt = new Date();
    await log.save();

    // Incrémente le compteur de la campagne
    await Campaign.findByIdAndUpdate(log.campaignId, {
      $inc: { totalUnsubscribed: 1 },
    });

    res.send(
      renderPage(
        '✅ Désabonnement confirmé',
        `L'adresse <strong>${log.recipient}</strong> a bien été retirée de notre liste de contacts.`,
        true
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Génère une page HTML simple de confirmation.
 */
const renderPage = (title: string, message: string, success: boolean): string => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; background:#f5f5f5; }
    .card { background:#fff; border-radius:12px; padding:40px; max-width:480px; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
    .icon { font-size:48px; margin-bottom:16px; }
    h1 { font-size:22px; color: ${success ? '#16a34a' : '#dc2626'}; }
    p { color:#555; line-height:1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>
`;
