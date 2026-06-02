// ─── Campagnes ───────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'sending' | 'completed' | 'cancelled';

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
  createdAt: string;
  completedAt?: string;
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export type EmailStatus = 'sent' | 'failed' | 'pending';

export interface EmailLog {
  _id: string;
  campaignId: string;
  recipient: string;
  subject: string;
  status: EmailStatus;
  errorMessage?: string;
  unsubscribeToken: string;
  unsubscribedAt?: string;
  sentAt: string;
}

// ─── Réponses API ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  campaignId?: string;
}

// ─── Payload d'envoi ─────────────────────────────────────────────────────────

export interface SendCampaignPayload {
  name: string;
  subject: string;
  htmlBody: string;
  recipients: string[];
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
