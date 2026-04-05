import Link from 'next/link';
import { useAdminStats } from '@/controllers/useAdmin';
import { Loader2, Users, Activity, Pill, CalendarClock, FileText, ClipboardList, ShieldCheck, TrendingUp } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, color, href }) {
  const inner = (
    <div className="card flex items-center gap-4 hover:shadow-md hover:shadow-black/30 transition cursor-pointer">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value ?? '—'}</p>
        <p className="text-sm text-slate-400">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const { stats, loading } = useAdminStats();

  if (loading) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );

  const u = stats?.users;

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      {/* Header */}
      <div className="bg-navy-900 border-b border-navy-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-brand-400" />
          <h1 className="text-lg font-bold">Dr. Jigree — Admin</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin/users" className="text-brand-400 hover:underline">Users</Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-200">← Patient App</Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Platform Overview</h2>
          <p className="text-slate-400 text-sm mt-1">All-users statistics across Dr. Jigree</p>
        </div>

        {/* User stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={Users}     label="Total Users"    value={u?.total}    sub={`${u?.admins || 0} admin(s) · ${u?.inactive || 0} suspended`} color="bg-brand-500"  href="/admin/users" />
          <StatCard icon={ShieldCheck} label="Admins"       value={u?.admins}   color="bg-violet-500" href="/admin/users?filter=admin" />
          <StatCard icon={Users}     label="Active Users"   value={(u?.total || 0) - (u?.inactive || 0)} color="bg-green-600" />
        </div>

        {/* Health data stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={ClipboardList} label="Assessments"  value={stats?.assessments?.total} color="bg-orange-500" />
          <StatCard icon={Pill}          label="Medications"  value={stats?.medications?.total}  color="bg-accent-500" />
          <StatCard icon={CalendarClock} label="Appointments" value={stats?.appointments?.total} color="bg-sky-500" />
          <StatCard icon={Activity}      label="Health Records" value={stats?.records?.total}    color="bg-teal-500" />
          <StatCard icon={FileText}      label="Documents"    value={stats?.documents?.total}    color="bg-pink-500" />
        </div>

        {/* Recent registrations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-400" /> Recent Registrations
            </h3>
            <Link href="/admin/users" className="text-xs text-brand-400 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-slate-400 border-b border-navy-600">
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-left py-2 pr-4">Email</th>
                  <th className="text-left py-2 pr-4">Role</th>
                  <th className="text-left py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentUsers || []).map(u => (
                  <tr key={u.id} className="border-b border-navy-700/50 hover:bg-navy-700/30">
                    <td className="py-2 pr-4">
                      <Link href={`/admin/users/${u.id}`} className="text-brand-400 hover:underline font-medium">{u.full_name}</Link>
                    </td>
                    <td className="py-2 pr-4 text-slate-400">{u.email}</td>
                    <td className="py-2 pr-4">
                      {u.is_admin
                        ? <span className="bg-violet-500/20 text-violet-300 text-xs px-2 py-0.5 rounded-full">Admin</span>
                        : <span className="bg-navy-600 text-slate-400 text-xs px-2 py-0.5 rounded-full">User</span>}
                    </td>
                    <td className="py-2 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
