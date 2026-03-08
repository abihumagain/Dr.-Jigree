import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard, ClipboardList, Activity, Pill,
  CalendarClock, FolderOpen, User, LogOut, Bell, Menu, X, HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const NAV = [
  { href: '/dashboard',   label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/assessment',  label: 'Risk Assessment', icon: Activity },
  { href: '/records',     label: 'Health Records',  icon: ClipboardList },
  { href: '/medications', label: 'Medications',     icon: Pill },
  { href: '/appointments',label: 'Appointments',    icon: CalendarClock },
  { href: '/documents',   label: 'Documents',       icon: FolderOpen },
  { href: '/profile',     label: 'My Profile',      icon: User },
];

export default function Layout({ children, title = 'Dr. Jigree' }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Mobile overlay ── */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:relative z-30 h-full w-64 bg-white border-r border-slate-100
        flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-blue-700 leading-none">Dr. Jigree</p>
            <p className="text-xs text-slate-400">Health Portfolio</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-slate-400" />
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
        </nav>

        {/* User section */}
        {user && (
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{user.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={logout}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors w-full">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-3 shrink-0">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
          <h1 className="text-base font-semibold text-slate-800 flex-1">{title}</h1>
          <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 transition">
            <Bell className="w-5 h-5 text-slate-500" />
          </Link>
          <Link href="/profile">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
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
