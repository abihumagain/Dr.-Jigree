import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, User, Camera, Save, HeartPulse } from 'lucide-react';

const BLOOD_TYPES = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];

export default function Profile() {
  const { user, ready, updateUser } = useAuth();
  const router = useRouter();
  const [form, setForm]     = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats]   = useState(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    Promise.all([
      api.get('/profile'),
      api.get('/dashboard')
    ]).then(([p, d]) => {
      setForm(p.data);
      setStats(d.data);
    }).finally(() => setLoading(false));
  }, [ready, user]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/profile', form);
      updateUser(data);
      toast.success('Profile updated');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const uploadPicture = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('picture', file);
    try {
      const { data } = await api.post('/profile/picture', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(f => ({ ...f, profile_picture: data.profile_picture }));
      updateUser({ ...user, profile_picture: data.profile_picture });
      toast.success('Profile picture updated');
    } catch { toast.error('Upload failed'); }
  };

  if (!ready || loading) return (
    <Layout title="My Profile">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    </Layout>
  );

  const latestRisk = stats?.latestAssessment;

  return (
    <Layout title="My Profile">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">My Profile</h2>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Avatar + stats */}
          <div className="space-y-4">
            {/* Avatar */}
            <div className="card flex flex-col items-center text-center">
              <div className="relative mb-4">
                {form.profile_picture ? (
                  <img src={form.profile_picture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center text-brand-400 text-3xl font-bold shadow">
                    {form.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-brand-600 transition">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={uploadPicture} />
                </label>
              </div>
              <p className="font-bold text-slate-100">{form.full_name}</p>
              <p className="text-sm text-slate-400">{form.email}</p>
              <p className="text-xs text-slate-500 mt-1">Member since {new Date(form.created_at).toLocaleDateString()}</p>
            </div>

            {/* Health indicators */}
            <div className="card">
              <h3 className="font-semibold text-slate-300 mb-3 flex items-center gap-2 text-sm">
                <HeartPulse className="w-4 h-4 text-brand-400" /> Health Indicators
              </h3>
              {latestRisk ? (
                <div className="space-y-2">
                  <Row label="Risk Level" value={latestRisk.risk_label}
                    cls={latestRisk.risk_label === 'High' ? 'text-red-600 font-bold' : latestRisk.risk_label === 'Moderate' ? 'text-yellow-600 font-bold' : 'text-green-600 font-bold'} />
                  <Row label="Risk Score" value={latestRisk.risk_score ? Math.round(latestRisk.risk_score*100)+'%' : '—'} />
                  {latestRisk.bmi && <Row label="BMI" value={latestRisk.bmi} />}
                  {latestRisk.systolic_bp && <Row label="Blood Pressure" value={`${latestRisk.systolic_bp}/${latestRisk.diastolic_bp} mmHg`} />}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Complete a health assessment to see your indicators here.</p>
              )}
            </div>
          </div>

          {/* Edit form */}
          <div className="lg:col-span-2">
            <form onSubmit={save} className="card space-y-4">
              <h3 className="font-semibold text-slate-100 border-b border-navy-700 pb-3 mb-1">Personal Information</h3>
              <div>
                <label className="label">Full name</label>
                <input className="input" name="full_name" value={form.full_name || ''} onChange={handle} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date of birth</label>
                  <input className="input" type="date" name="date_of_birth" value={form.date_of_birth || ''} onChange={handle} />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" name="gender" value={form.gender || ''} onChange={handle}>
                    <option value="">Select…</option>
                    <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input className="input" name="phone" value={form.phone || ''} onChange={handle} placeholder="+44…" />
                </div>
                <div>
                  <label className="label">Blood type</label>
                  <select className="input" name="blood_type" value={form.blood_type || ''} onChange={handle}>
                    <option value="">Unknown</option>
                    {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Address</label>
                <textarea className="input" name="address" value={form.address || ''} onChange={handle} rows={2} />
              </div>
              <div>
                <label className="label">Emergency contact</label>
                <input className="input" name="emergency_contact" value={form.emergency_contact || ''} onChange={handle} placeholder="Name — Phone number" />
              </div>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save changes</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Row({ label, value, cls = 'text-slate-700' }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={cls}>{value}</span>
    </div>
  );
}
