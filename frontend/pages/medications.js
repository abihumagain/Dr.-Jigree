import Layout from '@/components/Layout';
import { useMedications } from '@/controllers/useMedications';
import { Plus, Trash2, Pencil, X, Loader2, Pill, CheckCircle2, XCircle } from 'lucide-react';

const FREQ = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'Every 12 hours', 'Weekly', 'As needed', 'Other'];

export default function Medications() {
  const { meds, loading, modal, setModal, editing, form, setForm, saving, filter, setFilter, openAdd, openEdit, handle, save, del, shown } = useMedications();

  return (
    <Layout title="Medications">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Medications</h2>
            <p className="text-slate-400 text-sm mt-1">Manage your prescriptions and supplements</p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Medication
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {['active','inactive','all'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${filter === f ? 'bg-brand-500 text-white' : 'bg-navy-700 border border-navy-600 text-slate-300 hover:bg-navy-600'}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
        ) : shown.length === 0 ? (
          <div className="card text-center py-16">
            <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No {filter === 'all' ? '' : filter} medications found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {shown.map(m => (
              <div key={m.id} className={`card border-l-4 ${m.active ? 'border-accent-400' : 'border-navy-600'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.active ? 'bg-accent-500/10' : 'bg-navy-700'}`}>
                      <Pill className={`w-4 h-4 ${m.active ? 'text-accent-400' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.dosage} · {m.frequency}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {m.active
                      ? <CheckCircle2 className="w-4 h-4 text-accent-400 mt-1" />
                      : <XCircle      className="w-4 h-4 text-slate-600 mt-1" />}
                  </div>
                </div>
                {m.prescriber && <p className="text-xs text-slate-400 mt-2">Prescribed by: {m.prescriber}</p>}
                {(m.start_date || m.end_date) && (
                  <p className="text-xs text-slate-400 mt-1">
                    {m.start_date && `From: ${m.start_date}`}{m.end_date && ` · Until: ${m.end_date}`}
                  </p>
                )}
                {m.notes && <p className="text-xs text-slate-500 mt-1 italic">{m.notes}</p>}
                <div className="flex gap-2 mt-3 pt-3 border-t border-navy-600">
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
          <div className="bg-navy-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-navy-600">
              <h3 className="font-bold text-slate-100">{editing ? 'Edit' : 'Add'} Medication</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-200" /></button>
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
                    className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.active ? 'bg-accent-500' : 'bg-navy-600'}`}>
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
