import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { I18nProvider } from './i18n';
import AppShell from './components/AppShell';
import QRGenerator from './pages/QRGenerator';
import Dashboard from './pages/Dashboard';
import RegisterCitizen from './pages/RegisterCitizen';
import CitizensList from './pages/CitizensList';
import CitizenDetails from './pages/CitizenDetails';
import EditCitizen from './pages/EditCitizen';
import IdCardPreview from './pages/IdCardPreview';
import QRVerification from './pages/QRVerification';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import UsersManagement from './pages/UsersManagement';
import PublicVerify from './pages/PublicVerify';

// A simple protected route wrapper
const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

const RequirePermission = ({ permission, children }: { permission: string, children: React.ReactNode }) => {
  const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  const userPerms = rawUser ? JSON.parse(rawUser)?.permissions : null;
  
  if (!userPerms) {
    // Session exists but lacks permissions object (old session format), force re-login
    localStorage.removeItem('isAuthenticated');
    return <Navigate to="/login" replace />;
  }

  if (userPerms[permission] !== true) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)' }}>You do not have permission to view this page. Please contact your administrator.</p>
      </div>
    );
  }
  
  return children;
};

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Public QR verification — no login required */}
          <Route path="/verify/:nationalId" element={<PublicVerify />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<RequirePermission permission="viewDashboard"><Dashboard /></RequirePermission>} />
              <Route path="register" element={<RequirePermission permission="registerCitizen"><RegisterCitizen /></RequirePermission>} />
              <Route path="citizens" element={<RequirePermission permission="viewCitizens"><CitizensList /></RequirePermission>} />
              <Route path="citizens/:id" element={<RequirePermission permission="viewCitizens"><CitizenDetails /></RequirePermission>} />
              <Route path="citizens/:id/edit" element={<RequirePermission permission="editCitizen"><EditCitizen /></RequirePermission>} />
              <Route path="id-cards" element={<RequirePermission permission="viewIdCards"><IdCardPreview /></RequirePermission>} />
              <Route path="id-cards/:id" element={<RequirePermission permission="viewIdCards"><IdCardPreview /></RequirePermission>} />
              <Route path="qr-verify" element={<RequirePermission permission="verifyQR"><QRVerification /></RequirePermission>} />
              <Route path="reports" element={<RequirePermission permission="viewReports"><Reports /></RequirePermission>} />
              <Route path="settings" element={<RequirePermission permission="viewSettings"><Settings /></RequirePermission>} />
              <Route path="qr/:id" element={<RequirePermission permission="viewIdCards"><QRGenerator /></RequirePermission>} />
              <Route path="users" element={<RequirePermission permission="viewUsers"><UsersManagement /></RequirePermission>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}
