import { Router } from "express";
import multer from "multer";
import {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  deleteContacts,
  importContacts,
  getTags,
} from "../controllers/contactController";
import { importLimiter } from "../middlewares/rateLimiter";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.originalname.endsWith(".csv") ||
      file.mimetype === "text/plain"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers CSV sont acceptés."));
    }
  },
});

const router = Router();

// ── Routes spéciales (avant /:id) ─────────────────────────────────────────────
router.get("/tags", getTags);
router.post("/import", importLimiter, upload.single("file"), importContacts);
router.delete("/bulk", deleteContacts);

// ── CRUD standard ─────────────────────────────────────────────────────────────
router.post("/", createContact);
router.get("/", getContacts);
router.get("/:id", getContact);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
