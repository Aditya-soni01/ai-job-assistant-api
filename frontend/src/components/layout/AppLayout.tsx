import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, User, Settings,
  HelpCircle, LogOut, Search, Menu, X,
} from 'lucide-react';
import { authStore } from '@/store/authStore';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resume', icon: Sparkles, label: 'Resume Optimizer' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/support', icon: HelpCircle, label: 'Support' },
];

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = authStore();
  const navigate = useNavigate();

  const initials =
    `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    '?';
  const displayName =
    `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || user?.username || '';

  return (
    <div className="min-h-screen bg-[#051424]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 z-50 flex flex-col py-6
          border-r border-[#273647]/20 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'rgba(13,28,45,0.92)', backdropFilter: 'blur(20px)' }}
      >
        {/* Logo */}
        <div className="px-6 mb-10 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 no-underline cursor-pointer">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)' }}
            >
              <Sparkles className="w-4 h-4 text-[#340080]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter genie-gradient-text">
                RoleGenie
              </h1>
              <p className="mono-label text-[10px] uppercase tracking-widest text-[#4edea3]/70">
                AI Intelligence
              </p>
            </div>
          </Link>
          <button
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium tracking-tight
                ${isActive
                  ? 'text-[#d0bcff] bg-[#273647]/60'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#273647]/40'}`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Upgrade CTA */}
        <div className="px-4 mt-6">
          <div
            className="p-4 rounded-xl mb-4"
            style={{
              background: 'rgba(39,54,71,0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(208,188,255,0.1)',
            }}
          >
            <p className="mono-label text-xs font-bold tracking-widest uppercase mb-1 text-[#d0bcff]">
              Limit Reached
            </p>
            <p className="text-sm text-[#cbc3d7] mb-3">
              Unlock 100+ AI optimizations per month.
            </p>
            <button
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)',
                color: '#340080',
              }}
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </aside>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 pr-6 lg:pl-72 lg:pr-8">
        {/* Left: hamburger + search */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden text-slate-400 hover:text-white p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div
            className="hidden md:flex items-center gap-2 rounded-full px-4 py-1.5 w-72 lg:w-96"
            style={{
              background: 'rgba(39,54,71,0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(73,68,84,0.15)',
            }}
          >
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search resumes, skills, or optimizations..."
              className="bg-transparent border-none focus:outline-none text-sm w-full text-[#d4e4fa] placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Right: user info + avatar */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-[#d4e4fa] leading-tight">{displayName}</p>
              <p className="mono-label text-[10px] text-[#d0bcff] uppercase">
                {user.email?.split('@')[0]}
              </p>
            </div>
            <div className="relative group">
              <button
                className="w-9 h-9 rounded-full border-2 border-[#273647] flex items-center justify-center cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)' }}
              >
                <span className="text-xs font-bold text-[#340080]">{initials}</span>
              </button>
              {/* Dropdown */}
              <div
                className="absolute right-0 top-11 w-48 rounded-xl py-1 shadow-2xl z-10
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150"
                style={{
                  background: 'rgba(13,28,45,0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(39,54,71,0.5)',
                }}
              >
                <button
                  onClick={() => navigate('/settings')}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-[#273647]/50 hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-[#273647]/50 hover:text-white transition-colors border-t border-[#273647]/50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <main className="pt-16 min-h-screen bg-[#051424] lg:ml-64">
        <Outlet />
      </main>

      {/* Background ambient glows */}
      <div
        className="fixed top-0 right-0 w-1/2 h-1/2 rounded-full pointer-events-none -z-10"
        style={{ background: 'rgba(208,188,255,0.03)', filter: 'blur(120px)' }}
      />
      <div
        className="fixed bottom-0 left-64 w-2/5 h-2/5 rounded-full pointer-events-none -z-10"
        style={{ background: 'rgba(78,222,163,0.03)', filter: 'blur(100px)' }}
      />
    </div>
  );
};

export default AppLayout;
