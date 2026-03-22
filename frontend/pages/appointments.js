import Layout from '@/components/Layout';
import { useAppointments } from '@/controllers/useAppointments';
import { Plus, Trash2, Pencil, X, Loader2, CalendarClock, MapPin, User2 } from 'lucide-react';

const SPECIALTIES = ['General Practice','Cardiology','Endocrinology','Neurology','Oncology','Orthopaedics','Paediatrics','Psychiatry','Radiology','Other'];

const STATUS_STYLES = {
  scheduled:  'bg-brand-500/20 text-brand-300',
  completed:  'bg-green-900/30 text-green-400',
  cancelled:  'bg-red-900/30 text-red-400',
  rescheduled:'bg-yellow-900/30 text-yellow-400',
};

export default function Appointments() {
  const { appts, loading, modal, setModal, editing, form, setForm, saving, filter, setFilter, openAdd, openEdit, handle, save, del, shown } = useAppointments();

  return (
    <Layout title="Appointments">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Appointments</h2>
            <p className="text-slate-400 text-sm mt-1">Schedule and track your medical appointments</p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Schedule
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-5">
          {['upcoming','past','all'].map(f => (
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
            <CalendarClock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No {filter} appointments found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shown.map(a => (
              <div key={a.id} className="card flex gap-4">
                {/* Date column */}
                <div className="shrink-0 text-center w-14">
                  <div className="bg-brand-500 text-white rounded-t-xl text-xs font-bold py-1">
                    {new Date(a.appointment_date + 'T00:00:00').toLocaleString('default', { month: 'short' })}
                  </div>
                  <div className="border border-t-0 border-brand-500/30 rounded-b-xl py-1.5 text-xl font-bold text-brand-400 bg-brand-500/10">
                    {new Date(a.appointment_date + 'T00:00:00').getDate()}
                  </div>
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-semibold text-slate-100">{a.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {a.doctor_name && <span className="text-xs text-slate-400 flex items-center gap-1"><User2 className="w-3 h-3" />{a.doctor_name}</span>}
                        {a.specialty   && <span className="text-xs text-slate-500">{a.specialty}</span>}
                        {a.appointment_time && <span className="text-xs text-brand-400 font-medium">{a.appointment_time}</span>}
                      </div>
                      {a.location && <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{a.location}</p>}
                      {a.notes    && <p className="text-xs text-slate-500 mt-1 italic">{a.notes}</p>}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[a.status] || STATUS_STYLES.scheduled}`}>
                      {a.status}
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => openEdit(a)} className="text-slate-500 hover:text-brand-400 transition"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(a.id)} className="text-slate-500 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
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
              <h3 className="font-bold text-slate-100">{editing ? 'Edit' : 'New'} Appointment</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-200" /></button>
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
