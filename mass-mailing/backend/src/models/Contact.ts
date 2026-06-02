import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  email: string;
  firstName: string;
  lastName: string;
  tags: string[];
  isUnsubscribed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    email: {
      type: String,
      required: [true, "L'e-mail est requis."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Format d\'e-mail invalide.'],
      index: true,
    },
    firstName: {
      type: String,
      default: '',
      trim: true,
    },
    lastName: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isUnsubscribed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Index composé pour la recherche full-text
ContactSchema.index({ email: 'text', firstName: 'text', lastName: 'text' });

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
