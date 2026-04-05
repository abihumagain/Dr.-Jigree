import Link from 'next/link';
import { useAdminUsers } from '@/controllers/useAdmin';
import {
  Loader2, ShieldCheck, ShieldOff, UserX, UserCheck,
  Eye, KeyRound, Trash2, Search, Users
} from 'lucide-react';

export default function AdminUsers() {
  const {
    shown, loading, search, setSearch, filter, setFilter,
    toggleAdmin, toggleActive, remove, doImpersonate,
  } = useAdminUsers();

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      {/* Header */}
      <div className="bg-navy-900 border-b border-navy-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-brand-400" />
          <h1 className="text-lg font-bold">Dr. Jigree — Admin</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="text-slate-400 hover:text-slate-200">Overview</Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-200">← Patient App</Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-brand-400" /> User Management</h2>
            <p className="text-slate-400 text-sm mt-1">{shown.length} user(s) shown</p>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9 w-full"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['all','admin','inactive'].map(f => (
              <button key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${filter === f ? 'bg-brand-500 text-white' : 'bg-navy-700 border border-navy-600 text-slate-300 hover:bg-navy-600'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
        ) : shown.length === 0 ? (
          <div className="card text-center py-16 text-slate-400">No users found.</div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-400 border-b border-navy-600">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-center px-4 py-3">Assessments</th>
                  <th className="text-center px-4 py-3">Meds</th>
                  <th className="text-center px-4 py-3">Appts</th>
                  <th className="text-center px-4 py-3">Risk</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Role</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(u => (
                  <tr key={u.id} className={`border-b border-navy-700/50 hover:bg-navy-700/30 ${!u.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="font-medium text-brand-400 hover:underline block">{u.full_name}</Link>
                      <span className="text-slate-400 text-xs">{u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">{u.assessment_count}</td>
                    <td className="px-4 py-3 text-center">{u.medication_count}</td>
                    <td className="px-4 py-3 text-center">{u.appointment_count}</td>
                    <td className="px-4 py-3 text-center">
                      {u.latest_risk
                        ? <span className={u.latest_risk === 'High' ? 'badge-high' : u.latest_risk === 'Moderate' ? 'badge-moderate' : 'badge-low'}>{u.latest_risk}</span>
                        : <span className="text-slate-500 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.is_active
                        ? <span className="bg-green-900/30 text-green-400 text-xs px-2 py-0.5 rounded-full">Active</span>
                        : <span className="bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded-full">Suspended</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {u.is_admin
                        ? <span className="bg-violet-500/20 text-violet-300 text-xs px-2 py-0.5 rounded-full">Admin</span>
                        : <span className="bg-navy-600 text-slate-400 text-xs px-2 py-0.5 rounded-full">User</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/users/${u.id}`} title="View detail" className="text-slate-400 hover:text-brand-400 transition"><Eye className="w-4 h-4" /></Link>
                        <button onClick={() => toggleAdmin(u.id, u.is_admin)} title={u.is_admin ? 'Remove admin' : 'Make admin'}
                          className="text-slate-400 hover:text-violet-400 transition">
                          {u.is_admin ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => toggleActive(u.id, u.is_active)} title={u.is_active ? 'Suspend' : 'Reactivate'}
                          className="text-slate-400 hover:text-yellow-400 transition">
                          {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => doImpersonate(u.id)} title="View app as this user"
                          className="text-slate-400 hover:text-teal-400 transition">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(u.id)} title="Delete user"
                          className="text-slate-400 hover:text-red-400 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
