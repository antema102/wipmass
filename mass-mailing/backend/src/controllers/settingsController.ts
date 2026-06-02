import { NextFunction, Request, Response } from 'express';
import { MailSettings } from '../models/MailSettings';

interface MailSettingsBody {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
}

const getDefaultSettings = (): MailSettingsBody => ({
  smtpHost: process.env.SMTP_HOST ?? 'smtp.ionos.fr',
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpSecure: (process.env.SMTP_SECURE ?? 'true').toLowerCase() === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
  fromName: process.env.FROM_NAME ?? 'No Reply',
  fromEmail: (process.env.FROM_EMAIL ?? '').trim().toLowerCase(),
});

const upsertDefaultSettingsIfMissing = async (): Promise<void> => {
  const exists = await MailSettings.findOne({ key: 'mail' }).lean();
  if (exists) return;

  await MailSettings.create({
    key: 'mail',
    ...getDefaultSettings(),
  });
};

export const getMailSettings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await upsertDefaultSettingsIfMissing();
    const settings = await MailSettings.findOne({ key: 'mail' }).lean();

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateMailSettings = async (
  req: Request<{}, {}, MailSettingsBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      fromName,
      fromEmail,
    } = req.body;

    if (!smtpHost || !smtpUser || !smtpPass || !fromName || !fromEmail) {
      res.status(400).json({ success: false, message: 'Tous les champs SMTP et From sont requis.' });
      return;
    }

    const normalizedFromEmail = fromEmail.trim().toLowerCase();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedFromEmail);
    if (!isEmailValid) {
      res.status(400).json({ success: false, message: 'FROM_EMAIL invalide.' });
      return;
    }

    const port = Number(smtpPort);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      res.status(400).json({ success: false, message: 'SMTP_PORT invalide.' });
      return;
    }

    const settings = await MailSettings.findOneAndUpdate(
      { key: 'mail' },
      {
        $set: {
          smtpHost: smtpHost.trim(),
          smtpPort: port,
          smtpSecure: Boolean(smtpSecure),
          smtpUser: smtpUser.trim(),
          smtpPass,
          fromName: fromName.trim(),
          fromEmail: normalizedFromEmail,
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      success: true,
      message: 'Paramètres mail mis à jour.',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
