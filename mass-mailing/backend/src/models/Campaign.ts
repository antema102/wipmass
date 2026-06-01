import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaign extends Document {
  name: string;
  subject: string;
  htmlBody: string;
  recipients: string[];
  totalSent: number;
  totalFailed: number;
  totalUnsubscribed: number;
  status: 'draft' | 'sending' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    htmlBody: { type: String, required: true },
    recipients: { type: [String], required: true },
    totalSent: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    totalUnsubscribed: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'sending', 'completed', 'cancelled'],
      default: 'draft',
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
