import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  getMedications, addMedication, updateMedication, deleteMedication,
} from '@/services/medicationsService';

const EMPTY = {
  name: '', dosage: '', frequency: '', start_date: '',
  end_date: '', prescriber: '', notes: '', active: 1,
};

export function useMedications() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [meds, setMeds]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [filter, setFilter]   = useState('active');

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    load();
  }, [ready, user]);

  const load = () => getMedications().then(setMeds).finally(() => setLoading(false));

  const openAdd  = () => { setEditing(null); setForm({ ...EMPTY }); setModal(true); };
  const openEdit = m  => { setEditing(m.id); setForm({ ...m });     setModal(true); };

  const handle = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const data = await updateMedication(editing, form);
        setMeds(ms => ms.map(m => m.id === editing ? data : m));
        toast.success('Medication updated');
      } else {
        const data = await addMedication(form);
        setMeds(ms => [data, ...ms]);
        toast.success('Medication added');
      }
      setModal(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Remove this medication?')) return;
    await deleteMedication(id);
    setMeds(ms => ms.filter(m => m.id !== id));
    toast.success('Removed');
  };

  const shown = filter === 'active'
    ? meds.filter(m => m.active)
    : filter === 'inactive'
    ? meds.filter(m => !m.active)
    : meds;

  return {
    meds, loading, modal, setModal, editing, form, setForm,
    saving, filter, setFilter, openAdd, openEdit, handle, save, del, shown,
  };
}
