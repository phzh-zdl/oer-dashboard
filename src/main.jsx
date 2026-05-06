import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css';
import { configError } from './lib/supabase.js';
import Catalog from './pages/Catalog.jsx';
import ConfigError from './pages/ConfigError.jsx';
import Datenschutz from './pages/Datenschutz.jsx';
import Impressum from './pages/Impressum.jsx';
import Login from './pages/admin/Login.jsx';
import AuthCallback from './pages/admin/AuthCallback.jsx';
import RequireAuth from './pages/admin/RequireAuth.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import ResourceList from './pages/admin/ResourceList.jsx';
import ResourceForm from './pages/admin/ResourceForm.jsx';
import CategoryList from './pages/admin/CategoryList.jsx';
import CategoryForm from './pages/admin/CategoryForm.jsx';

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
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/admin" element={<Login />} />
          <Route path="/admin/callback" element={<AuthCallback />} />
          <Route path="/admin/app" element={<RequireAuth />}>
            <Route element={<AdminLayout />}>
              <Route index element={<ResourceList />} />
              <Route path="new" element={<ResourceForm />} />
              <Route path=":id/edit" element={<ResourceForm />} />
              <Route path="categories" element={<CategoryList />} />
              <Route path="categories/new" element={<CategoryForm />} />
              <Route path="categories/:id/edit" element={<CategoryForm />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </React.StrictMode>
  );
}
