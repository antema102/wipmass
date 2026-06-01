import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
  attachments?: Array<{ filename: string; path: string }>;
}

class MailerService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.ionos.fr',
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Vérifie la connexion SMTP au démarrage.
   */
  async verify(): Promise<void> {
    await this.transporter.verify();
    console.log('✅ Connexion SMTP vérifiée.');
  }

  /**
   * Envoie un e-mail unique avec corps HTML.
   */
  async sendMail(options: MailOptions): Promise<SentMessageInfo> {
    const fromName = options.fromName ?? process.env.FROM_NAME ?? 'No Reply';
    const fromEmail = options.fromEmail ?? process.env.FROM_EMAIL ?? '';

    return this.transporter.sendMail({
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
