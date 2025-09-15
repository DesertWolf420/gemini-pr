const express = require('express');
const path = require('path');
const fileUploadRouter = require('./server/fileUpload');

const app = express();
const PORT = process.env.PORT || 3000;

// Statische Dateien für Frontend
app.use(express.static(path.join(__dirname, 'public')));

// Upload-Ordner bereitstellen (optional)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Datei-Upload-Router einbinden
app.use(fileUploadRouter);

// Start
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
