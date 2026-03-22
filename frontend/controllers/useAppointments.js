import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  getAppointments, addAppointment, updateAppointment, deleteAppointment,
} from '@/services/appointmentsService';

const EMPTY = {
  title: '', doctor_name: '', specialty: '', location: '',
  appointment_date: '', appointment_time: '', notes: '', status: 'scheduled',
};

export function useAppointments() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [appts, setAppts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [filter, setFilter]   = useState('upcoming');

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    load();
  }, [ready, user]);

  const load = () => getAppointments().then(setAppts).finally(() => setLoading(false));

  const handle   = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const openAdd  = () => { setEditing(null); setForm({ ...EMPTY }); setModal(true); };
  const openEdit = a  => { setEditing(a.id); setForm({ ...a });     setModal(true); };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const data = await updateAppointment(editing, form);
        setAppts(as => as.map(a => a.id === editing ? data : a));
        toast.success('Appointment updated');
      } else {
        const data = await addAppointment(form);
        setAppts(as => [data, ...as]);
        toast.success('Appointment scheduled');
      }
      setModal(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Delete this appointment?')) return;
    await deleteAppointment(id);
    setAppts(as => as.filter(a => a.id !== id));
    toast.success('Deleted');
  };

  const today = new Date().toISOString().split('T')[0];
  const shown = filter === 'upcoming'
    ? appts.filter(a => a.appointment_date >= today && a.status === 'scheduled')
    : filter === 'past'
    ? appts.filter(a => a.appointment_date < today || a.status !== 'scheduled')
    : appts;

  return {
    appts, loading, modal, setModal, editing, form, setForm,
    saving, filter, setFilter, openAdd, openEdit, handle, save, del, shown,
  };
}
