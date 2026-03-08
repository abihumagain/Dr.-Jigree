import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, X, Loader2, Pill, CheckCircle2, XCircle } from 'lucide-react';

const EMPTY = { name: '', dosage: '', frequency: '', start_date: '', end_date: '', prescriber: '', notes: '', active: 1 };
const FREQ   = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'Every 12 hours', 'Weekly', 'As needed', 'Other'];

export default function Medications() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [meds, setMeds]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    load();
  }, [ready, user]);

  const load = () => api.get('/medications').then(r => setMeds(r.data)).finally(() => setLoading(false));

  const openAdd  = () => { setEditing(null); setForm({ ...EMPTY }); setModal(true); };
  const openEdit = m  => { setEditing(m.id); setForm({ ...m }); setModal(true); };

  const handle = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.put(`/medications/${editing}`, form);
        setMeds(ms => ms.map(m => m.id === editing ? data : m));
        toast.success('Medication updated');
      } else {
        const { data } = await api.post('/medications', form);
        setMeds(ms => [data, ...ms]);
        toast.success('Medication added');
      }
      setModal(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Remove this medication?')) return;
    await api.delete(`/medications/${id}`);
    setMeds(ms => ms.filter(m => m.id !== id));
    toast.success('Removed');
  };

  const shown = filter === 'active' ? meds.filter(m => m.active) : filter === 'inactive' ? meds.filter(m => !m.active) : meds;

  return (
    <Layout title="Medications">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Medications</h2>
            <p className="text-slate-500 text-sm mt-1">Manage your prescriptions and supplements</p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Medication
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {['active','inactive','all'].map(f => (
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
            <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No {filter === 'all' ? '' : filter} medications found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {shown.map(m => (
              <div key={m.id} className={`card border-l-4 ${m.active ? 'border-teal-400' : 'border-slate-300'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.active ? 'bg-teal-50' : 'bg-slate-100'}`}>
                      <Pill className={`w-4 h-4 ${m.active ? 'text-teal-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.dosage} · {m.frequency}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {m.active
                      ? <CheckCircle2 className="w-4 h-4 text-teal-500 mt-1" />
                      : <XCircle      className="w-4 h-4 text-slate-300 mt-1" />}
                  </div>
                </div>
                {m.prescriber && <p className="text-xs text-slate-400 mt-2">Prescribed by: {m.prescriber}</p>}
                {(m.start_date || m.end_date) && (
                  <p className="text-xs text-slate-400 mt-1">
                    {m.start_date && `From: ${m.start_date}`}{m.end_date && ` · Until: ${m.end_date}`}
                  </p>
                )}
                {m.notes && <p className="text-xs text-slate-500 mt-1 italic">{m.notes}</p>}
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button onClick={() => openEdit(m)} className="btn-secondary text-xs flex items-center gap-1 py-1.5 px-3">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => del(m.id)} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1 px-2 transition">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
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
              <h3 className="font-bold text-slate-800">{editing ? 'Edit' : 'Add'} Medication</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div>
                <label className="label">Medication name *</label>
                <input className="input" name="name" value={form.name} onChange={handle} required placeholder="e.g. Metformin" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Dosage</label>
                  <input className="input" name="dosage" value={form.dosage} onChange={handle} placeholder="e.g. 500mg" />
                </div>
                <div>
                  <label className="label">Frequency</label>
                  <select className="input" name="frequency" value={form.frequency} onChange={handle}>
                    <option value="">Select…</option>
                    {FREQ.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start date</label>
                  <input className="input" type="date" name="start_date" value={form.start_date} onChange={handle} />
                </div>
                <div>
                  <label className="label">End date</label>
                  <input className="input" type="date" name="end_date" value={form.end_date} onChange={handle} />
                </div>
              </div>
              <div>
                <label className="label">Prescribing doctor</label>
                <input className="input" name="prescriber" value={form.prescriber} onChange={handle} placeholder="Dr. Name" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input" name="notes" value={form.notes} onChange={handle} rows={2} />
              </div>
              {editing && (
                <div className="flex items-center gap-3">
                  <label className="label mb-0">Active</label>
                  <button type="button" onClick={() => setForm(f => ({ ...f, active: f.active ? 0 : 1 }))}
                    className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.active ? 'bg-teal-500' : 'bg-slate-300'}`}>
                    <span className={`inline-block h-5 w-5 mt-0.5 transform rounded-full bg-white shadow transition ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
