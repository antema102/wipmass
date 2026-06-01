# 📧 Mass Mailing — Wip Outsourcing

Application web full-stack pour l'envoi de campagnes d'e-mails en masse, avec dashboard de suivi et système de désabonnement.

---

## 🗂️ Structure du projet

```
mass-mailing/
├── backend/                    # API Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts           # Connexion MongoDB
│   │   ├── models/
│   │   │   ├── Campaign.ts     # Schéma Mongoose des campagnes
│   │   │   └── EmailLog.ts     # Schéma Mongoose des logs
│   │   ├── controllers/
│   │   │   ├── campaignController.ts   # Logique d'envoi en masse
│   │   │   └── unsubscribeController.ts # Gestion désabonnement
│   │   ├── routes/
│   │   │   ├── campaigns.ts    # Routes campagnes
│   │   │   └── unsubscribe.ts  # Route désabonnement
│   │   ├── services/
│   │   │   └── mailerService.ts # Wrapper Nodemailer (singleton)
│   │   ├── middlewares/
│   │   │   └── errorHandler.ts # Gestion centralisée des erreurs
│   │   └── index.ts            # Point d'entrée du serveur
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                   # React + Vite + TypeScript + Tailwind CSS
    ├── src/
    │   ├── api/
    │   │   └── campaigns.ts    # Client HTTP Axios
    │   ├── components/
    │   │   ├── MailEditor.tsx  # Éditeur WYSIWYG (TipTap)
    │   │   └── RecipientManager.tsx # Gestion des destinataires
    │   ├── pages/
    │   │   ├── ComposePage.tsx # Page de composition
    │   │   └── DashboardPage.tsx # Dashboard statistiques
    │   ├── types/
    │   │   └── index.ts        # Types TypeScript partagés
    │   ├── App.tsx             # Routing et navigation
    │   ├── main.tsx            # Point d'entrée React
    │   └── index.css           # Styles Tailwind + TipTap
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js ≥ 18
- MongoDB (local ou Atlas)

---

### 1. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos vraies valeurs SMTP et MongoDB

# Démarrer en développement
npm run dev
```

Le serveur démarre sur **http://localhost:5000**

---

### 2. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer en développement
npm run dev
```

L'interface est accessible sur **http://localhost:5173**

---

## 📡 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/campaigns/send` | Lance l'envoi d'une campagne |
| `GET` | `/api/campaigns` | Liste toutes les campagnes |
| `GET` | `/api/campaigns/:id/logs` | Logs détaillés d'une campagne |
| `GET` | `/api/unsubscribe/:token` | Désabonnement via lien unique |
| `GET` | `/health` | Vérification de l'état du serveur |

### Exemple de requête `POST /api/campaigns/send`

```json
{
  "name": "Prospection Juin 2026",
  "subject": "Réduisez vos coûts RH de 5x",
  "htmlBody": "<p>Bonjour,</p><p>...</p>",
  "recipients": ["client1@example.com", "client2@example.com"]
}
```

---

## ✨ Fonctionnalités

- **Éditeur WYSIWYG** (TipTap) : gras, italique, listes, liens, alignement, titres
- **Gestion des destinataires** : copier-coller, import CSV, validation, déduplication
- **Envoi asynchrone** : la réponse API est immédiate, l'envoi continue en arrière-plan
- **Anti-spam** : délai aléatoire de 1 à 3s entre chaque envoi
- **Désabonnement automatique** : lien unique injecté dans chaque e-mail
- **Logs complets** : statut (sent/failed/pending), timestamp, erreur éventuelle
- **Dashboard** : KPIs globaux, graphique Recharts, historique, logs détaillés

---

## 🔧 Variables d'environnement Backend

| Variable | Description | Exemple |
|----------|-------------|---------|
| `PORT` | Port du serveur | `5000` |
| `MONGO_URI` | URI de connexion MongoDB | `mongodb://localhost:27017/mass_mailing` |
| `SMTP_HOST` | Serveur SMTP | `smtp.ionos.fr` |
| `SMTP_PORT` | Port SMTP | `465` |
| `SMTP_SECURE` | SSL/TLS | `true` |
| `SMTP_USER` | Identifiant SMTP | `contact1@wipwork.com` |
| `SMTP_PASS` | Mot de passe SMTP | `***` |
| `FROM_NAME` | Nom de l'expéditeur | `Thomas Garnier` |
| `FROM_EMAIL` | Adresse de l'expéditeur | `contact1@wipwork.com` |
| `APP_BASE_URL` | URL publique du backend | `http://localhost:5000` |
