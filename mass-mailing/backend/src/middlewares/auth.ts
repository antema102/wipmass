import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtUserPayload {
  email: string;
  role: 'admin';
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentification requise.' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({ success: false, message: 'JWT_SECRET non configuré.' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtUserPayload;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
  }
};
