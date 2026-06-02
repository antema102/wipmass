import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import campaignRoutes from "./routes/campaigns";
import unsubscribeRoutes from "./routes/unsubscribe";
import contactsRoutes from "./routes/contacts";
import trackingRoutes from "./routes/tracking";
import authRoutes from "./routes/auth";
import settingsRoutes from "./routes/settings";
import { requireAuth } from "./middlewares/auth";

import { errorHandler } from "./middlewares/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 5000;

// ── Middlewares globaux ──────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", requireAuth, campaignRoutes);
app.use("/api/unsubscribe", unsubscribeRoutes);
app.use("/api/contacts", requireAuth, contactsRoutes);
app.use("/api/settings", requireAuth, settingsRoutes);
// Keep both prefixes for backward compatibility.
app.use("/api/track", trackingRoutes);
app.use("/api/tracking", trackingRoutes);

// Ping de santé
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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
