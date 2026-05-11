import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LayoutDashboard, History, Settings, LogOut, Bot } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-surface-700/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 transform transition-transform group-hover:scale-105 group-hover:rotate-3">
            <Bot size={20} className="text-white" />
          </div>
          <span className="font-extrabold text-text-main text-lg tracking-tight hidden sm:block">
            Review<span className="text-brand-500">Agent</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              id={`nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 shadow-sm'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-800'
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden sm:block">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-2.5 bg-surface-800/50 px-3 py-1.5 rounded-full border border-surface-700/50">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-rose-400 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-sm text-text-main font-semibold">{user?.username}</span>
          </div>
          <button
            id="btn-logout"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-red-600 hover:bg-red-50 transition-all duration-300"
          >
            <LogOut size={16} />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

