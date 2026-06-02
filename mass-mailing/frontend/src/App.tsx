import { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import ComposePage from './pages/ComposePage';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { fetchMe } from './api/auth';
import type { AuthPayload, AuthUser } from './types';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-orange-500 text-white'
      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
  }`;

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const user = await fetchMe();
        setCurrentUser(user);
      } catch {
        localStorage.removeItem('auth_token');
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const handleLoginSuccess = (payload: AuthPayload) => {
    localStorage.setItem('auth_token', payload.token);
    setCurrentUser(payload.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navigation ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://www.wipwork.com/assets/WipWork-749f2510.png"
              alt="Wip Outsourcing"
              className="h-8 object-contain"
            />
            <span className="text-gray-700 font-semibold text-sm hidden sm:block">
              Mass Mailing
            </span>
          </div>
          <nav className="flex gap-2">
            <NavLink to="/" end className={navLinkClass}>
              ✉️ Composer
            </NavLink>
            <NavLink to="/contacts" className={navLinkClass}>
              👥 Contacts
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              ⚙️ Parametres
            </NavLink>
          </nav>
          <div className="flex items-center gap-3 ml-3">
            <span className="text-xs text-gray-500 hidden md:block">{currentUser.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 text-xs font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
            >
              Deconnexion
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<ComposePage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
