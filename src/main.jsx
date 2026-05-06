import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './styles.css';
import Catalog from './pages/Catalog.jsx';

function AdminPlaceholder({ title }) {
  return (
    <div className="loading-state">
      <h1 style={{ fontFamily: 'var(--f-display)', fontWeight: 400 }}>{title}</h1>
      <p>Diese Seite wird in einem späteren Schritt befüllt.</p>
      <p style={{ marginTop: 24, fontSize: 14 }}>
        <Link to="/">→ Zurück zum Katalog</Link>
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/admin" element={<AdminPlaceholder title="Admin-Login" />} />
        <Route path="/admin/callback" element={<AdminPlaceholder title="Anmeldung wird verarbeitet …" />} />
        <Route path="/admin/app/*" element={<AdminPlaceholder title="Admin-Panel" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
