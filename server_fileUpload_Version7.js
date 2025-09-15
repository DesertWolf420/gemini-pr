const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const upload = multer({
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur Fotos, XLSX, DOCX, PPTX, PDF und TXT Dateien erlaubt!'));
    }
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Keine Datei hochgeladen oder ungültiger Dateityp!' });
  }
  res.status(200).json({ message: 'Datei erfolgreich hochgeladen!', file: req.file });
});

module.exports = router;