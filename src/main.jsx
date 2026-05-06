import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css';
import { configError } from './lib/supabase.js';
import Catalog from './pages/Catalog.jsx';
import ConfigError from './pages/ConfigError.jsx';
import Login from './pages/admin/Login.jsx';
import AuthCallback from './pages/admin/AuthCallback.jsx';
import RequireAuth from './pages/admin/RequireAuth.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));

if (configError) {
  root.render(
    <React.StrictMode>
      <ConfigError message={configError} />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/admin" element={<Login />} />
          <Route path="/admin/callback" element={<AuthCallback />} />
          <Route path="/admin/app" element={<RequireAuth />}>
            <Route index element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}
