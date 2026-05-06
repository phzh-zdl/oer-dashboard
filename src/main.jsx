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
import AdminLayout from './pages/admin/AdminLayout.jsx';
import ResourceList from './pages/admin/ResourceList.jsx';
import ResourceForm from './pages/admin/ResourceForm.jsx';

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
            <Route element={<AdminLayout />}>
              <Route index element={<ResourceList />} />
              <Route path="new" element={<ResourceForm />} />
              <Route path=":id/edit" element={<ResourceForm />} />
              {/* Kategorien-Routen kommen mit Task #7 */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}
