const express = require('express');
const path = require('path');
const fileUploadRouter = require('./server_fileUpload_Version7');

const app = express();
const PORT = process.env.PORT || 3000;

// Statische Dateien für das Frontend (z.B. index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname)); // Damit auch index.html etc. gefunden werden

// Upload-Ordner für hochgeladene Dateien bereitstellen
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Datei-Upload-Router einbinden
app.use(fileUploadRouter);

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
