import { Routes, Route, NavLink } from 'react-router-dom';
import ComposePage from './pages/ComposePage';
import DashboardPage from './pages/DashboardPage';
import ContactsPage from './pages/ContactsPage';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-orange-500 text-white'
      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navigation ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://wipoutsourcing.com/assets/logo-D9ZicQF7.png"
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
          </nav>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<ComposePage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}
