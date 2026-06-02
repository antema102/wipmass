import { Request, Response, NextFunction } from 'express';
import { EmailLog } from '../models/EmailLog';
import { logger } from '../utils/logger';

// Pixel GIF transparent 1x1
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// ─── GET /api/track/open/:logId ───────────────────────────────────────────────

export const trackOpen = async (
  req: Request<{ logId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { logId } = req.params;

    // Met à jour uniquement si l'e-mail était "sent" (première ouverture)
    const log = await EmailLog.findById(logId);
    if (log && log.status === 'sent') {
      await EmailLog.findByIdAndUpdate(logId, {
        status:   'opened',
        openedAt: new Date(),
      });
      logger.info(`📬 Ouverture — ${log.recipient}`);
    }

    // Retourne le pixel 1x1
    res.set({
      'Content-Type':   'image/gif',
      'Content-Length': String(TRACKING_PIXEL.length),
      'Cache-Control':  'no-store, no-cache, must-revalidate, private',
      Pragma:           'no-cache',
      Expires:          '0',
    });
    res.end(TRACKING_PIXEL);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/track/click/:logId?url=... ─────────────────────────────────────

export const trackClick = async (
  req: Request<{ logId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { logId } = req.params;
    const { url }   = req.query as { url?: string };

    if (!url) {
      res.status(400).send('Paramètre url manquant.');
      return;
    }

    const targetUrl = decodeURIComponent(url);

    // Met à jour uniquement si pas encore cliqué
    const log = await EmailLog.findById(logId);
    if (log && log.status !== 'clicked') {
      await EmailLog.findByIdAndUpdate(logId, {
        status:    'clicked',
        clickedAt: new Date(),
        // Conserve openedAt si déjà défini
        ...(log.status !== 'opened' ? { openedAt: new Date() } : {}),
      });
      logger.info(`🖱️  Clic — ${log.recipient} → ${targetUrl}`);
    }

    res.redirect(302, targetUrl);
  } catch (error) {
    next(error);
  }
};
