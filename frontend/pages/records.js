import Layout from '@/components/Layout';
import { useRecords } from '@/controllers/useRecords';
import { Plus, Trash2, X, Loader2, Activity, FlaskConical } from 'lucide-react';

export default function Records() {
  const { records, loading, modal, setModal, tab, form, saving, filter, setFilter, openModal, handle, save, del, shown } = useRecords();

  return (
    <Layout title="Health Records">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Health Records</h2>
            <p className="text-slate-400 text-sm mt-1">Track your vitals and lab results</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openModal('vital')} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Vitals
            </button>
            <button onClick={() => openModal('lab')} className="btn-secondary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Lab
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {['all','vital','lab'].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === t ? 'bg-brand-500 text-white' : 'bg-navy-700 border border-navy-600 text-slate-300 hover:bg-navy-600'}`}>
              {t === 'all' ? 'All' : t === 'vital' ? 'Vitals' : 'Lab Results'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
        ) : shown.length === 0 ? (
          <div className="card text-center py-16">
            <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No records yet. Add your first health record above.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {shown.map(r => (
              <div key={r.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${r.record_type === 'vital' ? 'bg-brand-500/20' : 'bg-purple-500/20'}`}>
                      {r.record_type === 'vital' ? <Activity className="w-4 h-4 text-brand-400" /> : <FlaskConical className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-100">{r.title}</p>
                      <p className="text-xs text-slate-400">{new Date(r.recorded_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <button onClick={() => del(r.id)} className="text-slate-300 hover:text-red-500 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {r.record_type === 'vital' && (
                    <>
                      {r.systolic_bp && <Chip label="BP" val={`${r.systolic_bp}/${r.diastolic_bp} mmHg`} />}
                      {r.heart_rate  && <Chip label="Heart Rate" val={`${r.heart_rate} bpm`} />}
                      {r.temperature && <Chip label="Temp" val={`${r.temperature}°C`} />}
                      {r.oxygen_sat  && <Chip label="SpO₂" val={`${r.oxygen_sat}%`} />}
                    </>
                  )}
                  {r.record_type === 'lab' && (
                    <>
                      {r.glucose      && <Chip label="Glucose" val={`${r.glucose} mg/dL`} />}
                      {r.cholesterol  && <Chip label="Cholesterol" val={`${r.cholesterol} mg/dL`} />}
                      {r.hdl          && <Chip label="HDL" val={`${r.hdl} mg/dL`} />}
                      {r.ldl          && <Chip label="LDL" val={`${r.ldl} mg/dL`} />}
                      {r.hba1c        && <Chip label="HbA1c" val={`${r.hba1c}%`} />}
                    </>
                  )}
                </div>
                {r.notes && <p className="text-sm text-slate-500 mt-2 italic">{r.notes}</p>}
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
              <h3 className="font-bold text-slate-100">Add {tab === 'vital' ? 'Vitals' : 'Lab Results'}</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-200" /></button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div>
                <label className="label">Title / Description *</label>
                <input className="input" name="title" value={form.title} onChange={handle} required placeholder="e.g. Morning Vitals" />
              </div>
              {tab === 'vital' ? (
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Systolic BP (mmHg)"  name="systolic_bp"  form={form} handle={handle} />
                  <NumField label="Diastolic BP (mmHg)" name="diastolic_bp" form={form} handle={handle} />
                  <NumField label="Heart Rate (bpm)"    name="heart_rate"   form={form} handle={handle} />
                  <NumField label="Temperature (°C)"    name="temperature"  form={form} handle={handle} />
                  <NumField label="Oxygen Sat (%)"      name="oxygen_sat"   form={form} handle={handle} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <NumField label="Glucose (mg/dL)"     name="glucose"       form={form} handle={handle} />
                  <NumField label="Cholesterol (mg/dL)" name="cholesterol"   form={form} handle={handle} />
                  <NumField label="HDL (mg/dL)"         name="hdl"           form={form} handle={handle} />
                  <NumField label="LDL (mg/dL)"         name="ldl"           form={form} handle={handle} />
                  <NumField label="Triglycerides"       name="triglycerides" form={form} handle={handle} />
                  <NumField label="HbA1c (%)"           name="hba1c"         form={form} handle={handle} />
                </div>
              )}
              <div>
                <label className="label">Notes</label>
                <textarea className="input" name="notes" value={form.notes} onChange={handle} rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Chip({ label, val }) {
  return (
    <div className="bg-navy-700 border border-navy-600 rounded-lg px-3 py-1.5 text-xs">
      <span className="text-slate-400">{label}: </span>
      <span className="font-semibold text-slate-200">{val}</span>
    </div>
  );
}

function NumField({ label, name, form, handle }) {
  return (
    <div>
      <label className="label text-xs">{label}</label>
      <input className="input" type="number" step="0.1" name={name} value={form[name]} onChange={handle} />
    </div>
  );
}
