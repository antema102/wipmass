import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Contact } from '../models/Contact';
import { parseCsvContacts } from '../utils/csvParser';
import { logger } from '../utils/logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── POST /api/contacts ───────────────────────────────────────────────────────

export const createContact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, firstName = '', lastName = '', tags = [] } = req.body as {
      email?: string;
      firstName?: string;
      lastName?: string;
      tags?: string[];
    };

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ success: false, message: "E-mail invalide ou manquant." });
      return;
    }

    const existing = await Contact.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, message: "Ce contact existe déjà." });
      return;
    }

    const contact = await Contact.create({ email, firstName, lastName, tags });
    logger.success(`Contact créé : ${contact.email}`);
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/contacts ────────────────────────────────────────────────────────

export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      tag,
      unsubscribed,
      page  = '1',
      limit = '50',
    } = req.query as Record<string, string>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { email:     { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
      ];
    }
    if (tag)          query.tags          = tag;
    if (unsubscribed) query.isUnsubscribed = unsubscribed === 'true';

    const pageNum  = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip     = (pageNum - 1) * limitNum;

    const [contacts, total] = await Promise.all([
      Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Contact.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        total,
        page:  pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/contacts/:id ────────────────────────────────────────────────────

export const getContact = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'ID invalide.' });
      return;
    }
    const contact = await Contact.findById(req.params.id).lean();
    if (!contact) {
      res.status(404).json({ success: false, message: 'Contact introuvable.' });
      return;
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/contacts/:id ────────────────────────────────────────────────────

export const updateContact = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'ID invalide.' });
      return;
    }

    const { email, firstName, lastName, tags, isUnsubscribed } = req.body as {
      email?: string;
      firstName?: string;
      lastName?: string;
      tags?: string[];
      isUnsubscribed?: boolean;
    };

    if (email && !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ success: false, message: 'Format d\'e-mail invalide.' });
      return;
    }

    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      { email, firstName, lastName, tags, isUnsubscribed },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Contact introuvable.' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/contacts/:id ─────────────────────────────────────────────────

export const deleteContact = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'ID invalide.' });
      return;
    }

    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      res.status(404).json({ success: false, message: 'Contact introuvable.' });
      return;
    }

    logger.info(`🗑️  Contact supprimé : ${contact.email}`);
    res.json({ success: true, message: 'Contact supprimé.' });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/contacts (bulk) ──────────────────────────────────────────────

export const deleteContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { ids } = req.body as { ids?: string[] };

    if (!ids || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Liste d\'IDs requise.' });
      return;
    }

    const result = await Contact.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${result.deletedCount} contact(s) supprimé(s).` });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/contacts/import ────────────────────────────────────────────────

export const importContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Fichier CSV requis (champ : file).' });
      return;
    }

    const csvContent = req.file.buffer.toString('utf-8');
    let parsed;

    try {
      parsed = parseCsvContacts(csvContent);
    } catch {
      res.status(400).json({ success: false, message: 'Fichier CSV invalide ou mal formaté.' });
      return;
    }

    const valid   = parsed.filter((c) => EMAIL_REGEX.test(c.email));
    const invalid = parsed.length - valid.length;

    if (valid.length === 0) {
      res.status(400).json({ success: false, message: 'Aucun contact valide trouvé dans le fichier.' });
      return;
    }

    let imported = 0;
    let skipped  = 0;

    for (const c of valid) {
      try {
        await Contact.findOneAndUpdate(
          { email: c.email },
          {
            $setOnInsert: { firstName: c.firstName, lastName: c.lastName },
            $addToSet:    { tags: { $each: c.tags } },
          },
          { upsert: true }
        );
        imported++;
      } catch {
        skipped++;
      }
    }

    logger.success(`📥 Import CSV : ${imported} importé(s), ${skipped} ignoré(s), ${invalid} invalide(s).`);

    res.json({
      success: true,
      message: `${imported} contact(s) importé(s).`,
      data: { imported, skipped, invalid, total: parsed.length },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/contacts/tags ───────────────────────────────────────────────────

export const getTags = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tags = await Contact.distinct('tags');
    res.json({ success: true, data: tags.filter(Boolean).sort() });
  } catch (error) {
    next(error);
  }
};
