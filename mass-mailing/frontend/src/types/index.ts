// ─── Campagnes ───────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';

export interface Campaign {
  _id: string;
  name: string;
  subject: string;
  htmlBody: string;
  recipients: string[];
  totalSent: number;
  totalFailed: number;
  totalUnsubscribed: number;
  status: CampaignStatus;
  scheduledAt?: string;
  createdAt: string;
  completedAt?: string;
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export type EmailStatus = 'pending' | 'sent' | 'opened' | 'clicked' | 'failed';

export interface EmailLog {
  _id: string;
  campaignId: string;
  recipient: string;
  subject: string;
  status: EmailStatus;
  errorMessage?: string;
  unsubscribeToken: string;
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  unsubscribedAt?: string;
}

// ─── Réponses API ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  campaignId?: string;
  status?: string;
}

export interface AuthUser {
  email: string;
  role: 'admin';
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
}

export interface MailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
}

// ─── Payload d'envoi ─────────────────────────────────────────────────────────

export interface SendCampaignPayload {
  name: string;
  subject: string;
  htmlBody: string;
  recipients: string[];
  scheduledAt?: string;
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export interface Contact {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  tags: string[];
  isUnsubscribed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactsResponse {
  success: boolean;
  data: Contact[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateContactPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
}

export interface ImportContactsResult {
  imported: number;
  skipped: number;
  invalid: number;
  total: number;
}
