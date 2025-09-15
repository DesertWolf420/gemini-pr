import React, { useState } from 'react';

const allowedTypes = [
  'image/jpeg', 'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/pdf',
  'text/plain'
];

function FileUpload() {
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    const selected = e.target.files[0];
    if (selected && allowedTypes.includes(selected.type) && selected.size <= 3 * 1024 * 1024) {
      setFile(selected);
    } else {
      alert('Ungültiger Dateityp oder zu groß (max. 3MB)');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await fetch('/upload', { method: 'POST', body: formData });
    alert('Upload abgeschlossen');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept=".jpg,.jpeg,.png,.xlsx,.docx,.pptx,.pdf,.txt" onChange={handleChange} />
      <button type="submit">Hochladen</button>
    </form>
  );
}

export default FileUpload;