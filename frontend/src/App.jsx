import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CycloPousseListPage from './pages/CycloPousseListPage';
import CycloPousseDetailPage from './pages/CycloPousseDetailPage';
import CycloPousseFormPage from './pages/CycloPousseFormPage';
import CotisationsPage from './pages/CotisationsPage';
import UsersPage from './pages/UsersPage';
import JournalActivitesPage from './pages/JournalActivitesPage';
import VerificationPubliquePage from './pages/VerificationPubliquePage';
import { Loader } from 'lucide-react';

function Protected({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--ink)' }}>
      <Loader size={26} className="spin" color="var(--amber)" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Shell({ children }) {
  return (
    <div className="shell">
      <Sidebar />
      <main className="content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Route publique QR — sans connexion */}
      <Route path="/verifier/:token" element={<VerificationPubliquePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/*" element={
        <Protected>
          <Shell>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/cyclopousses" element={<CycloPousseListPage />} />
              <Route path="/cyclopousses/nouveau" element={<CycloPousseFormPage />} />
              <Route path="/cyclopousses/:id" element={<CycloPousseDetailPage />} />
              <Route path="/cyclopousses/:id/modifier" element={<CycloPousseFormPage />} />
              <Route path="/cotisations" element={<CotisationsPage />} />
              <Route path="/utilisateurs" element={<Protected adminOnly><UsersPage /></Protected>} />
              <Route path="/journal" element={<Protected adminOnly><JournalActivitesPage /></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Shell>
        </Protected>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { background:'var(--ink-2)',color:'var(--snow)',border:'1px solid var(--border)',fontFamily:"'DM Sans',sans-serif",fontSize:'.875rem' },
          success: { iconTheme:{ primary:'var(--ok)',secondary:'var(--ink)' } },
          error:   { iconTheme:{ primary:'var(--err)',secondary:'var(--ink)' } },
        }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
