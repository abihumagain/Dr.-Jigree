import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
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
        <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="#e2e8f0" strokeWidth="18" strokeLinecap="round" />
        {/* Coloured arc */}
        <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke={color} strokeWidth="18" strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * 251} 251`} />
        {/* Needle */}
        <g transform={`rotate(${-90 + deg}, 100, 100)`}>
          <line x1="100" y1="100" x2="100" y2="30" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill="#334155" />
        </g>
        <text x="100" y="95" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>{pct}%</text>
        <text x="100" y="110" textAnchor="middle" fontSize="11" fill="#64748b">{label} Risk</text>
      </svg>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, href }) {
  const content = (
    <div className={`card flex items-center gap-4 cursor-pointer hover:shadow-md transition ${href ? '' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      {href && <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function Dashboard() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, [ready, user]);

  if (!ready || loading) return (
    <Layout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  const risk = data?.latestAssessment;

  return (
    <Layout title="Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Good day, {user?.full_name?.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-500 text-sm mt-1">Here&apos;s your health summary</p>
      </div>

      {/* Risk + Stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Risk gauge card */}
        <div className="card lg:col-span-1 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-slate-600 mb-2">Current Risk Score</p>
          {risk ? (
            <>
              <RiskGauge score={risk.risk_score} label={risk.risk_label} />
              <p className="text-xs text-slate-400 mt-1">
                Last assessed: {new Date(risk.assessed_at).toLocaleDateString()}
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
            color="bg-blue-500" href="/records" />
          <StatCard icon={Pill} label="Active Medications" value={data?.activeMeds?.length || 0}
            color="bg-teal-500" href="/medications" />
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
            <h3 className="font-semibold text-slate-800">Recent Records</h3>
            <Link href="/records" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.recentRecords?.length > 0 ? (
            <ul className="space-y-3">
              {data.recentRecords.map(r => (
                <li key={r.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                  <span className="flex-1 truncate">{r.title}</span>
                  <span className="text-xs text-slate-400">{new Date(r.recorded_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm">No records yet</p>
              <Link href="/records" className="mt-2 inline-flex items-center gap-1 text-blue-600 text-xs hover:underline">
                <Plus className="w-3 h-3" /> Add first record
              </Link>
            </div>
          )}
        </div>

        {/* Active medications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Active Medications</h3>
            <Link href="/medications" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.activeMeds?.length > 0 ? (
            <ul className="space-y-3">
              {data.activeMeds.map(m => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <Pill className="w-4 h-4 text-teal-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.dosage} · {m.frequency}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm">No medications tracked</p>
              <Link href="/medications" className="mt-2 inline-flex items-center gap-1 text-blue-600 text-xs hover:underline">
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
            <h3 className="font-semibold text-slate-800">Upcoming Appointments</h3>
            <Link href="/appointments" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.upcomingAppts.map(a => (
              <div key={a.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50">
                <p className="font-medium text-sm truncate">{a.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{a.doctor_name}</p>
                <p className="text-xs text-blue-600 font-medium mt-1">{a.appointment_date} {a.appointment_time}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations preview */}
      {risk?.recommendations && (
        <div className="card border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">Latest Health Recommendation</h3>
              <p className="text-sm text-slate-600">
                {(() => { try { return JSON.parse(risk.recommendations)[0]; } catch { return risk.recommendations; } })()}
              </p>
              <Link href="/assessment" className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                See full assessment →
              </Link>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
