import { timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface LoginBody {
  email: string;
  password: string;
}

const safeStringEqual = (a: string, b: string): boolean => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
};

export const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
      return;
    }

    const adminEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD ?? '';
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminEmail || !adminPassword || !jwtSecret) {
      res.status(500).json({ success: false, message: 'Configuration auth incomplète.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!safeStringEqual(normalizedEmail, adminEmail) || !safeStringEqual(password, adminPassword)) {
      res.status(401).json({ success: false, message: 'Identifiants invalides.' });
      return;
    }

    const token = jwt.sign(
      { email: adminEmail, role: 'admin' },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '12h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          email: adminEmail,
          role: 'admin',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user as { email: string; role: 'admin' } | undefined;

    if (!user) {
      res.status(401).json({ success: false, message: 'Non authentifié.' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
