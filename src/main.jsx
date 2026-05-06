import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './styles.css';

function Placeholder({ title, children }) {
  return (
    <div style={{ maxWidth: 720, margin: '60px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontWeight: 500 }}>{title}</h1>
      <p style={{ color: '#6b6e75' }}>Diese Seite wird in einem späteren Schritt befüllt.</p>
      {children}
      <p style={{ marginTop: 40, fontSize: 14 }}>
        <Link to="/">→ Public-Katalog</Link> &nbsp;·&nbsp;
        <Link to="/admin">→ Admin-Login</Link>
      </p>
    </div>
  );
}

function CatalogPlaceholder() {
  return <Placeholder title="OER · Pädagogische Hochschule Zürich" />;
}

function LoginPlaceholder() {
  return <Placeholder title="Admin-Login" />;
}

function AuthCallbackPlaceholder() {
  return <Placeholder title="Anmeldung wird verarbeitet …" />;
}

function DashboardPlaceholder() {
  return <Placeholder title="Admin-Panel" />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CatalogPlaceholder />} />
        <Route path="/admin" element={<LoginPlaceholder />} />
        <Route path="/admin/callback" element={<AuthCallbackPlaceholder />} />
        <Route path="/admin/app/*" element={<DashboardPlaceholder />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
