import rateLimit from 'express-rate-limit';

/**
 * Limite générale de l'API : 200 requêtes / 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requêtes. Veuillez réessayer dans 15 minutes.',
  },
});

/**
 * Limite sur les routes d'envoi de campagnes : 20 lancements / heure
 */
export const sendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Limite d'envoi atteinte. Réessayez dans 1 heure.",
  },
});

/**
 * Limite sur l'import de contacts : 30 imports / heure
 */
export const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Limite d'import atteinte. Réessayez dans 1 heure.",
  },
});
