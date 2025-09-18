// server.js
const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const mime = require("mime-types");

const app = express();

// (Falls noch nicht vorhanden)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload-Verzeichnis
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Erlaubte Endungen & MIME-Types
const ALLOWED_EXT = new Set(["pdf", "pptx", "docx", "jpg", "jpeg", "txt", "xlsx"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  // Office
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  // Bilder
  "image/jpeg",
  // Text
  "text/plain"
]);

// Multer-Storage: Dateiname hart absichern
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // sichere, kollisionsarme Benennung
    const ext = (mime.extension(file.mimetype) || path.extname(file.originalname).slice(1) || "bin").toLowerCase();
    const base = path.parse(file.originalname).name.replace(/[^a-z0-9_\-]+/gi, "_").slice(0, 60);
    cb(null, `${Date.now()}_${base}.${ext}`);
  },
});

// Filter: Typen prüfen
function fileFilter(req, file, cb) {
  const ext = (mime.extension(file.mimetype) || path.extname(file.originalname).slice(1) || "").toLowerCase();
  const ok = ALLOWED_EXT.has(ext) && ALLOWED_MIME.has(file.mimetype);
  if (!ok) return cb(new Error("Unzulässiger Dateityp."), false);
  cb(null, true);
}

// Multer-Instance mit 4 MB Limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4 MB
    files: 1,
  },
});

// Upload-Endpoint
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: "Keine Datei empfangen." });
  }

  // Hier könntest du die Datei an Gemini weiterreichen oder analysieren.
  // Für jetzt geben wir Meta-Infos zurück:
  return res.json({
    ok: true,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mime: req.file.mimetype,
    size: req.file.size,
    path: `/uploads/${req.file.filename}`,
  });
});

// (Optional) Statische Auslieferung der Uploads – nur wenn gewollt!
app.use("/uploads", express.static(UPLOAD_DIR, {
  // Sicherheits-Header
  setHeaders: (res) => {
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("X-Content-Type-Options", "nosniff");
  },
}));

// ...dein restlicher Server (z.B. vorhandene Routen)

// Start (falls nicht schon vorhanden)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf :${PORT}`));
