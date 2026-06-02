import { Request, Response, NextFunction } from "express";
import { EmailLog } from "../models/EmailLog";
import { logger } from "../utils/logger";

// Pixel GIF transparent 1x1
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

// ─── GET /api/track/open/:logId ───────────────────────────────────────────────

export const trackOpen = async (
  req: Request<{ logId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { logId } = req.params;

    const log = await EmailLog.findById(logId);
    if (log) {
      const updates: Record<string, unknown> = {};

      if (!log.openedAt) {
        updates.openedAt = new Date();
      }

      // On passe a "opened" uniquement si l'e-mail est encore en etat "sent"
      if (log.status === "sent") {
        updates.status = "opened";
      }

      if (Object.keys(updates).length > 0) {
        await EmailLog.findByIdAndUpdate(logId, updates);
      }

      logger.info(`📬 Ouverture — ${log.recipient}`);
    }

    // Retourne le pixel 1x1
    res.set({
      "Content-Type": "image/gif",
      "Content-Length": String(TRACKING_PIXEL.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
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
  next: NextFunction,
): Promise<void> => {
  try {
    const { logId } = req.params;
    const { url } = req.query as { url?: string };

    if (!url) {
      res.status(400).send("Paramètre url manquant.");
      return;
    }

    const targetUrl = decodeURIComponent(url);

    // Met a jour le clic de façon idempotente
    const log = await EmailLog.findById(logId);
    if (log) {
      const now = new Date();
      const updates: Record<string, unknown> = {
        status: "clicked",
      };

      if (!log.clickedAt) {
        updates.clickedAt = now;
      }

      // Un clic implique que l'e-mail a ete ouvert/affiche
      if (!log.openedAt) {
        updates.openedAt = now;
      }

      await EmailLog.findByIdAndUpdate(logId, updates);
      logger.info(`🖱️  Clic — ${log.recipient} → ${targetUrl}`);
    }

    res.redirect(302, targetUrl);
  } catch (error) {
    next(error);
  }
};
