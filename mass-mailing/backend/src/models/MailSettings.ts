import mongoose, { Document, Schema } from 'mongoose';

export interface IMailSettings extends Document {
  key: 'mail';
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromName: string;
  fromEmail: string;
  updatedAt: Date;
  createdAt: Date;
}

const MailSettingsSchema = new Schema<IMailSettings>(
  {
    key: {
      type: String,
      enum: ['mail'],
      default: 'mail',
      unique: true,
      index: true,
    },
    smtpHost: { type: String, required: true, trim: true },
    smtpPort: { type: Number, required: true, min: 1, max: 65535 },
    smtpSecure: { type: Boolean, required: true, default: true },
    smtpUser: { type: String, required: true, trim: true },
    smtpPass: { type: String, required: true },
    fromName: { type: String, required: true, trim: true },
    fromEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format e-mail invalide'],
    },
  },
  { timestamps: true }
);

export const MailSettings = mongoose.model<IMailSettings>('MailSettings', MailSettingsSchema);
