import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import { MailSettings } from '../models/MailSettings';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
  attachments?: Array<{ filename: string; path: string }>;
}

class MailerService {
  private transporter: Transporter | null = null;
  private transporterCacheKey: string | null = null;

  private getDefaultSettings() {
    return {
      smtpHost: process.env.SMTP_HOST ?? 'smtp.ionos.fr',
      smtpPort: Number(process.env.SMTP_PORT ?? 465),
      smtpSecure: (process.env.SMTP_SECURE ?? 'true').toLowerCase() === 'true',
      smtpUser: process.env.SMTP_USER ?? '',
      smtpPass: process.env.SMTP_PASS ?? '',
      fromName: process.env.FROM_NAME ?? 'No Reply',
      fromEmail: process.env.FROM_EMAIL ?? '',
    };
  }

  private async getRuntimeSettings() {
    const defaults = this.getDefaultSettings();
    const settings = await MailSettings.findOne({ key: 'mail' }).lean();

    if (!settings) {
      return defaults;
    }

    return {
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpSecure: settings.smtpSecure,
      smtpUser: settings.smtpUser,
      smtpPass: settings.smtpPass,
      fromName: settings.fromName,
      fromEmail: settings.fromEmail,
    };
  }

  private async getTransporter(): Promise<Transporter> {
    const settings = await this.getRuntimeSettings();
    const cacheKey = [
      settings.smtpHost,
      settings.smtpPort,
      settings.smtpSecure,
      settings.smtpUser,
      settings.smtpPass,
    ].join('|');

    if (this.transporter && this.transporterCacheKey === cacheKey) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });
    this.transporterCacheKey = cacheKey;

    return this.transporter;
  }

  /**
   * Vérifie la connexion SMTP au démarrage.
   */
  async verify(): Promise<void> {
    const transporter = await this.getTransporter();
    await transporter.verify();
    console.log('✅ Connexion SMTP vérifiée.');
  }

  /**
   * Envoie un e-mail unique avec corps HTML.
   */
  async sendMail(options: MailOptions): Promise<SentMessageInfo> {
    const settings = await this.getRuntimeSettings();
    const transporter = await this.getTransporter();
    const fromName = options.fromName ?? settings.fromName ?? 'No Reply';
    const fromEmail = options.fromEmail ?? settings.fromEmail ?? '';

    return transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
  }
}

// Singleton exporté
export const mailerService = new MailerService();
