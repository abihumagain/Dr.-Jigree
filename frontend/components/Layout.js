import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard, ClipboardList, Activity, Pill,
  CalendarClock, FolderOpen, User, LogOut, Bell, Menu, X, HeartPulse, ShieldCheck, Dumbbell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/assessment',   label: 'Risk Assessment', icon: Activity },
  { href: '/records',      label: 'Health Records',  icon: ClipboardList },
  { href: '/medications',  label: 'Medications',     icon: Pill },
  { href: '/appointments', label: 'Appointments',    icon: CalendarClock },
  { href: '/workouts',     label: 'Workout Plan',    icon: Dumbbell },
  { href: '/documents',    label: 'Documents',       icon: FolderOpen },
  { href: '/profile',      label: 'My Profile',      icon: User },
];

export default function Layout({ children, title = 'Dr. Jigree' }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      {/* ── Mobile overlay ── */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:relative z-30 h-full w-64
        bg-navy-950 border-r border-navy-700
        flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-navy-700">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white leading-none tracking-wide">Dr. Jigree</p>
            <p className="text-xs text-slate-500">Health Portfolio</p>
          </div>
          <button className="ml-auto lg:hidden text-slate-500 hover:text-white" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`sidebar-link ${router.pathname === href ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
          {user?.is_admin ? (
            <>
              <div className="my-2 border-t border-navy-700" />
              <Link href="/admin"
                className={`sidebar-link ${router.pathname.startsWith('/admin') ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-violet-400" />
                Admin Panel
              </Link>
            </>
          ) : null}
        </nav>

        {/* User section */}
        {user && (
          <div className="p-4 border-t border-navy-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center font-bold text-brand-400 text-sm">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-slate-200 truncate">{user.full_name}</p>
                  {user.is_admin ? <ShieldCheck className="w-3.5 h-3.5 text-violet-400 shrink-0" title="Admin" /> : null}
                </div>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={logout}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-400 transition-colors w-full">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-navy-800 border-b border-navy-700 flex items-center px-4 gap-3 shrink-0">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-white flex-1">{title}</h1>
          <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-navy-700 transition">
            <Bell className="w-5 h-5 text-slate-400 hover:text-brand-400" />
          </Link>
          <Link href="/profile">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold shadow shadow-brand-500/40">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </Link>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
