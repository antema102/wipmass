import mongoose, { Document, Schema } from 'mongoose';

export type EmailStatus = 'pending' | 'sent' | 'opened' | 'clicked' | 'failed';

export interface IEmailLog extends Document {
  campaignId: mongoose.Types.ObjectId;
  recipient: string;
  subject: string;
  status: EmailStatus;
  errorMessage?: string;
  unsubscribeToken: string;
  unsubscribedAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  sentAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'opened', 'clicked', 'failed'] as EmailStatus[],
      default: 'pending',
      index: true,
    },
    openedAt: { type: Date, default: null },
    clickedAt: { type: Date, default: null },
    errorMessage: {
      type: String,
      default: null,
    },
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
