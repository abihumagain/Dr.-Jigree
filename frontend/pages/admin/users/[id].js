import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAdminUserDetail } from '@/controllers/useAdmin';
import { fmtDate, fmtDateTime } from '@/lib/date';
import {
  ArrowLeft, ShieldCheck, ShieldOff, UserX, UserCheck,
  KeyRound, Loader2, AlertCircle, ClipboardList, Pill,
  CalendarClock, FolderOpen, Activity, User
} from 'lucide-react';
import { useState } from 'react';

const TABS = [
  { key: 'assessments', label: 'Assessments', icon: Activity },
  { key: 'medications', label: 'Medications', icon: Pill },
  { key: 'appointments', label: 'Appointments', icon: CalendarClock },
  { key: 'records', label: 'Health Records', icon: ClipboardList },
  { key: 'documents', label: 'Documents', icon: FolderOpen },
];

function RiskBadge({ level }) {
  if (!level) return <span className="text-slate-500">—</span>;
  const cls = level === 'High' ? 'bg-red-900/30 text-red-400' : level === 'Moderate' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400';
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{level}</span>;
}

function SectionEmpty({ label }) {
  return <p className="text-slate-500 text-sm py-6 text-center">No {label} found.</p>;
}

export default function AdminUserDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [tab, setTab] = useState('assessments');

  const {
    detail, loading,
    pwModal, setPwModal, newPw, setNewPw,
    saving, doResetPassword, doPromote, doSuspend,
  } = useAdminUserDetail(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!detail) return null;

  const u = detail.user;

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      {/* Admin header */}
      <div className="bg-navy-900 border-b border-navy-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-brand-400" />
          <h1 className="text-lg font-bold">Dr. Jigree — Admin</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="text-slate-400 hover:text-slate-200">Overview</Link>
          <Link href="/admin/users" className="text-slate-400 hover:text-slate-200">Users</Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-200">← Patient App</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>

        {/* Profile card */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center text-brand-400 text-xl font-bold shrink-0">
                {u.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{u.full_name}</h2>
                  {u.is_admin
                    ? <span className="bg-violet-500/20 text-violet-300 text-xs px-2 py-0.5 rounded-full">Admin</span>
                    : <span className="bg-navy-600 text-slate-400 text-xs px-2 py-0.5 rounded-full">User</span>}
                  {u.is_active
                    ? <span className="bg-green-900/30 text-green-400 text-xs px-2 py-0.5 rounded-full">Active</span>
                    : <span className="bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded-full">Suspended</span>}
                </div>
                <p className="text-slate-400 text-sm">{u.email}</p>
                <p className="text-slate-500 text-xs mt-1">
                  Joined {fmtDate(u.created_at)}
                  {u.phone && ` · ${u.phone}`}
                  {u.blood_type && ` · Blood: ${u.blood_type}`}
                  {u.gender && ` · ${u.gender}`}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <button onClick={() => doPromote(u.id, u.is_admin)}
                className="btn-secondary flex items-center gap-1.5 text-sm">
                {u.is_admin ? <><ShieldOff className="w-4 h-4" /> Remove Admin</> : <><ShieldCheck className="w-4 h-4" /> Make Admin</>}
              </button>
              <button onClick={() => doSuspend(u.id, u.is_active)}
                className="btn-secondary flex items-center gap-1.5 text-sm">
                {u.is_active ? <><UserX className="w-4 h-4" /> Suspend</> : <><UserCheck className="w-4 h-4" /> Reactivate</>}
              </button>
              <button onClick={() => setPwModal(true)}
                className="btn-secondary flex items-center gap-1.5 text-sm">
                <KeyRound className="w-4 h-4" /> Reset Password
              </button>
            </div>
          </div>

          {u.address && <p className="text-slate-400 text-sm mt-3">Address: {u.address}</p>}
          {u.emergency_contact && <p className="text-slate-400 text-sm">Emergency: {u.emergency_contact}</p>}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-navy-700 mb-5 flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${tab === key ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'assessments' && (
          <div className="card overflow-x-auto p-0">
            {!detail.assessments?.length ? <SectionEmpty label="assessments" /> : (
              <table className="w-full text-sm">
                <thead><tr className="text-xs uppercase text-slate-400 border-b border-navy-600">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Risk</th>
                  <th className="text-left px-4 py-3">Score</th>
                  <th className="text-left px-4 py-3">Age</th>
                  <th className="text-left px-4 py-3">BP</th>
                  <th className="text-left px-4 py-3">Cholesterol</th>
                </tr></thead>
                <tbody>
                  {detail.assessments.map((a, i) => (
                    <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/20">
                      <td className="px-4 py-3 text-slate-300">{fmtDate(a.assessed_at || a.created_at)}</td>
                      <td className="px-4 py-3"><RiskBadge level={a.risk_label} /></td>
                      <td className="px-4 py-3">{a.risk_score != null ? (a.risk_score * 100).toFixed(1) : '—'}%</td>
                      <td className="px-4 py-3">{a.age ?? '—'}</td>
                      <td className="px-4 py-3">{a.systolic_bp && a.diastolic_bp ? `${a.systolic_bp}/${a.diastolic_bp}` : '—'}</td>
                      <td className="px-4 py-3">{a.cholesterol ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'medications' && (
          <div className="card overflow-x-auto p-0">
            {!detail.medications?.length ? <SectionEmpty label="medications" /> : (
              <table className="w-full text-sm">
                <thead><tr className="text-xs uppercase text-slate-400 border-b border-navy-600">
                  <th className="text-left px-4 py-3">Medication</th>
                  <th className="text-left px-4 py-3">Dosage</th>
                  <th className="text-left px-4 py-3">Frequency</th>
                  <th className="text-left px-4 py-3">Start</th>
                  <th className="text-left px-4 py-3">End</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr></thead>
                <tbody>
                  {detail.medications.map((m, i) => (
                    <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/20">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3 text-slate-400">{m.dosage ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{m.frequency ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{m.start_date ? fmtDate(m.start_date) : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{m.end_date ? fmtDate(m.end_date) : 'Ongoing'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${m.is_active ? 'bg-green-900/30 text-green-400' : 'bg-navy-600 text-slate-400'}`}>
                          {m.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'appointments' && (
          <div className="card overflow-x-auto p-0">
            {!detail.appointments?.length ? <SectionEmpty label="appointments" /> : (
              <table className="w-full text-sm">
                <thead><tr className="text-xs uppercase text-slate-400 border-b border-navy-600">
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Doctor</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr></thead>
                <tbody>
                  {detail.appointments.map((a, i) => (
                    <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/20">
                      <td className="px-4 py-3 font-medium">{a.title}</td>
                      <td className="px-4 py-3 text-slate-400">{a.doctor_name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{a.appointment_date ? fmtDate(a.appointment_date + 'T00:00:00') : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{a.appointment_type ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          a.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                          a.status === 'cancelled' ? 'bg-red-900/30 text-red-400' :
                          'bg-blue-900/30 text-blue-400'
                        }`}>{a.status ?? 'upcoming'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'records' && (
          <div className="card overflow-x-auto p-0">
            {!detail.records?.length ? <SectionEmpty label="health records" /> : (
              <table className="w-full text-sm">
                <thead><tr className="text-xs uppercase text-slate-400 border-b border-navy-600">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">BP</th>
                  <th className="text-left px-4 py-3">Heart Rate</th>
                  <th className="text-left px-4 py-3">Weight</th>
                  <th className="text-left px-4 py-3">Blood Sugar</th>
                  <th className="text-left px-4 py-3">Notes</th>
                </tr></thead>
                <tbody>
                  {detail.records.map((r, i) => (
                    <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/20">
                      <td className="px-4 py-3 text-slate-300">{fmtDate(r.recorded_at || r.created_at)}</td>
                      <td className="px-4 py-3 text-slate-400">{r.systolic_bp && r.diastolic_bp ? `${r.systolic_bp}/${r.diastolic_bp}` : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{r.heart_rate ? `${r.heart_rate} bpm` : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{r.weight ? `${r.weight} kg` : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{r.blood_sugar ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{r.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'documents' && (
          <div className="card overflow-x-auto p-0">
            {!detail.documents?.length ? <SectionEmpty label="documents" /> : (
              <table className="w-full text-sm">
                <thead><tr className="text-xs uppercase text-slate-400 border-b border-navy-600">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Size</th>
                  <th className="text-left px-4 py-3">Uploaded</th>
                </tr></thead>
                <tbody>
                  {detail.documents.map((d, i) => (
                    <tr key={i} className="border-b border-navy-700/50 hover:bg-navy-700/20">
                      <td className="px-4 py-3 font-medium">{d.original_name ?? d.file_name}</td>
                      <td className="px-4 py-3 text-slate-400">{d.file_type ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{d.file_size ? `${Math.round(d.file_size / 1024)} KB` : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{fmtDate(d.uploaded_at || d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Password reset modal */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm">
            <h3 className="text-lg font-bold mb-1">Reset Password</h3>
            <p className="text-slate-400 text-sm mb-4">Set a new password for <strong>{u.full_name}</strong>.</p>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input w-full mb-4"
              placeholder="Min. 8 characters"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPwModal(false)} className="btn-secondary" disabled={saving}>Cancel</button>
              <button onClick={doResetPassword} className="btn-primary" disabled={saving || newPw.length < 8}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
