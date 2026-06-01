import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db';
import campaignRoutes from './routes/campaigns';
import unsubscribeRoutes from './routes/unsubscribe';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 5000;

// ── Middlewares globaux ──────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/campaigns', campaignRoutes);
app.use('/api/unsubscribe', unsubscribeRoutes);

// Ping de santé
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Gestionnaire d'erreurs global ────────────────────────────────────────────
app.use(errorHandler);

// ── Démarrage ────────────────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  });
};

startServer().catch(console.error);
