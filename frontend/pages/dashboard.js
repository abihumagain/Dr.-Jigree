import Link from 'next/link';
import Layout from '@/components/Layout';
import { useDashboard } from '@/controllers/useDashboard';
import { fmtDate } from '@/lib/date';
import {
  Activity, Pill, CalendarClock, ClipboardList,
  TrendingUp, AlertTriangle, CheckCircle, ChevronRight, Plus
} from 'lucide-react';

function RiskGauge({ score = 0, label = 'Unknown' }) {
  const pct   = Math.round(score * 100);
  const color = label === 'High' ? '#ef4444' : label === 'Moderate' ? '#f59e0b' : '#22c55e';
  const deg   = Math.round((pct / 100) * 180);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-44">
        {/* Background arc */}
        <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="#163354" strokeWidth="18" strokeLinecap="round" />
        {/* Coloured arc */}
        <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke={color} strokeWidth="18" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 251} 251`} />
        {/* Needle */}
        <g transform={`rotate(${-90 + deg}, 100, 100)`}>
          <line x1="100" y1="100" x2="100" y2="30" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill="#94a3b8" />
        </g>
        <text x="100" y="95" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>{pct}%</text>
        <text x="100" y="110" textAnchor="middle" fontSize="11" fill="#64748b">{label} Risk</text>
      </svg>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, href }) {
  const content = (
    <div className={`card flex items-center gap-4 cursor-pointer hover:shadow-md hover:shadow-black/30 transition ${href ? '' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
      {href && <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function Dashboard() {
  const { data, loading, user } = useDashboard();

  if (loading) return (
    <Layout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  const risk = data?.latestAssessment;

  return (
    <Layout title="Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">
          Good day, {user?.full_name?.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-400 text-sm mt-1">Here&apos;s your health summary</p>
      </div>

      {/* Risk + Stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Risk gauge card */}
        <div className="card lg:col-span-1 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-slate-300 mb-2">Current Risk Score</p>
          {risk ? (
            <>
              <RiskGauge score={risk.risk_score} label={risk.risk_label} />
              <p className="text-xs text-slate-400 mt-1">
                Last assessed: {fmtDate(risk.assessed_at)}
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm mb-3">No assessment yet</p>
              <Link href="/assessment" className="btn-primary text-sm px-4 py-2">
                Start Assessment
              </Link>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatCard icon={ClipboardList} label="Health Records" value={data?.recentRecords?.length || 0}
            color="bg-brand-500" href="/records" />
          <StatCard icon={Pill} label="Active Medications" value={data?.activeMeds?.length || 0}
            color="bg-accent-500" href="/medications" />
          <StatCard icon={CalendarClock} label="Upcoming Appointments" value={data?.upcomingAppts?.length || 0}
            color="bg-violet-500" href="/appointments" />
          <StatCard icon={Activity} label="Assessments Done" value={risk ? '✓' : '0'}
            color="bg-orange-400" href="/assessment" />
        </div>
      </div>

      {/* Recent records + Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Recent records */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Recent Records</h3>
            <Link href="/records" className="text-xs text-brand-400 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.recentRecords?.length > 0 ? (
            <ul className="space-y-3">
              {data.recentRecords.map(r => (
                <li key={r.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                  <span className="flex-1 truncate text-slate-300">{r.title}</span>
                  <span className="text-xs text-slate-500">{fmtDate(r.recorded_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm">No records yet</p>
              <Link href="/records" className="mt-2 inline-flex items-center gap-1 text-brand-400 text-xs hover:underline">
                <Plus className="w-3 h-3" /> Add first record
              </Link>
            </div>
          )}
        </div>

        {/* Active medications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Active Medications</h3>
            <Link href="/medications" className="text-xs text-brand-400 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.activeMeds?.length > 0 ? (
            <ul className="space-y-3">
              {data.activeMeds.map(m => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <Pill className="w-4 h-4 text-accent-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 truncate">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.dosage} · {m.frequency}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm">No medications tracked</p>
              <Link href="/medications" className="mt-2 inline-flex items-center gap-1 text-brand-400 text-xs hover:underline">
                <Plus className="w-3 h-3" /> Add medication
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming appointments */}
      {data?.upcomingAppts?.length > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-100">Upcoming Appointments</h3>
            <Link href="/appointments" className="text-xs text-brand-400 hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.upcomingAppts.map(a => (
              <div key={a.id} className="border border-navy-600 rounded-xl p-3 bg-navy-700">
                <p className="font-medium text-sm text-slate-200 truncate">{a.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.doctor_name}</p>
                <p className="text-xs text-brand-400 font-medium mt-1">{a.appointment_date} {a.appointment_time}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations preview */}
      {risk?.recommendations && (
        <div className="card border-l-4 border-brand-500">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-100 mb-2">Latest Health Recommendation</h3>
              <p className="text-sm text-slate-300">
                {(() => { try { return JSON.parse(risk.recommendations)[0]; } catch { return risk.recommendations; } })()}
              </p>
              <Link href="/assessment" className="text-xs text-brand-400 hover:underline mt-2 inline-block">
                See full assessment →
              </Link>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
