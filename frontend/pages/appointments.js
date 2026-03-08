import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, X, Loader2, CalendarClock, MapPin, User2 } from 'lucide-react';

const EMPTY = { title: '', doctor_name: '', specialty: '', location: '', appointment_date: '', appointment_time: '', notes: '', status: 'scheduled' };
const SPECIALTIES = ['General Practice','Cardiology','Endocrinology','Neurology','Oncology','Orthopaedics','Paediatrics','Psychiatry','Radiology','Other'];

const STATUS_STYLES = {
  scheduled:  'bg-blue-100 text-blue-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-700',
  rescheduled:'bg-yellow-100 text-yellow-700',
};

export default function Appointments() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [appts, setAppts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    load();
  }, [ready, user]);

  const load = () => api.get('/appointments').then(r => setAppts(r.data)).finally(() => setLoading(false));
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const openAdd  = () => { setEditing(null); setForm({ ...EMPTY }); setModal(true); };
  const openEdit = a  => { setEditing(a.id); setForm({ ...a }); setModal(true); };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.put(`/appointments/${editing}`, form);
        setAppts(as => as.map(a => a.id === editing ? data : a));
        toast.success('Appointment updated');
      } else {
        const { data } = await api.post('/appointments', form);
        setAppts(as => [data, ...as]);
        toast.success('Appointment scheduled');
      }
      setModal(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Delete this appointment?')) return;
    await api.delete(`/appointments/${id}`);
    setAppts(as => as.filter(a => a.id !== id));
    toast.success('Deleted');
  };

  const today = new Date().toISOString().split('T')[0];
  const shown = filter === 'upcoming'
    ? appts.filter(a => a.appointment_date >= today && a.status === 'scheduled')
    : filter === 'past' ? appts.filter(a => a.appointment_date < today || a.status !== 'scheduled')
    : appts;

  return (
    <Layout title="Appointments">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Appointments</h2>
            <p className="text-slate-500 text-sm mt-1">Schedule and track your medical appointments</p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Schedule
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5">
          {['upcoming','past','all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : shown.length === 0 ? (
          <div className="card text-center py-16">
            <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No {filter} appointments found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map(a => (
              <div key={a.id} className="card flex gap-4">
                {/* Date column */}
                <div className="shrink-0 text-center w-14">
                  <div className="bg-blue-600 text-white rounded-t-xl text-xs font-bold py-1">
                    {new Date(a.appointment_date + 'T00:00:00').toLocaleString('default', { month: 'short' })}
                  </div>
                  <div className="border border-t-0 border-blue-100 rounded-b-xl py-1.5 text-xl font-bold text-blue-700">
                    {new Date(a.appointment_date + 'T00:00:00').getDate()}
                  </div>
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-slate-800">{a.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {a.doctor_name && <span className="text-xs text-slate-500 flex items-center gap-1"><User2 className="w-3 h-3" />{a.doctor_name}</span>}
                        {a.specialty   && <span className="text-xs text-slate-400">{a.specialty}</span>}
                        {a.appointment_time && <span className="text-xs text-blue-600 font-medium">{a.appointment_time}</span>}
                      </div>
                      {a.location && <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{a.location}</p>}
                      {a.notes    && <p className="text-xs text-slate-400 mt-1 italic">{a.notes}</p>}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[a.status] || STATUS_STYLES.scheduled}`}>
                      {a.status}
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => openEdit(a)} className="text-slate-400 hover:text-blue-600 transition"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(a.id)} className="text-slate-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">{editing ? 'Edit' : 'New'} Appointment</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" name="title" value={form.title} onChange={handle} required placeholder="e.g. Annual Checkup" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Doctor name</label>
                  <input className="input" name="doctor_name" value={form.doctor_name} onChange={handle} />
                </div>
                <div>
                  <label className="label">Specialty</label>
                  <select className="input" name="specialty" value={form.specialty} onChange={handle}>
                    <option value="">Select…</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date *</label>
                  <input className="input" type="date" name="appointment_date" value={form.appointment_date} onChange={handle} required />
                </div>
                <div>
                  <label className="label">Time</label>
                  <input className="input" type="time" name="appointment_time" value={form.appointment_time} onChange={handle} />
                </div>
              </div>
              <div>
                <label className="label">Location / Clinic</label>
                <input className="input" name="location" value={form.location} onChange={handle} />
              </div>
              {editing && (
                <div>
                  <label className="label">Status</label>
                  <select className="input" name="status" value={form.status} onChange={handle}>
                    {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Notes</label>
                <textarea className="input" name="notes" value={form.notes} onChange={handle} rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Update' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
