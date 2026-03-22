import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getRecords, addRecord, deleteRecord } from '@/services/recordsService';

export const EMPTY_VITAL = {
  record_type: 'vital', title: '',
  systolic_bp: '', diastolic_bp: '', heart_rate: '', temperature: '', oxygen_sat: '', notes: '',
};
export const EMPTY_LAB = {
  record_type: 'lab', title: '',
  glucose: '', cholesterol: '', hdl: '', ldl: '', triglycerides: '', hba1c: '', notes: '',
};

export function useRecords() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [tab, setTab]         = useState('vital');
  const [form, setForm]       = useState({ ...EMPTY_VITAL });
  const [saving, setSaving]   = useState(false);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    load();
  }, [ready, user]);

  const load = () => getRecords().then(setRecords).finally(() => setLoading(false));

  const openModal = (type = 'vital') => {
    setTab(type);
    setForm(type === 'vital' ? { ...EMPTY_VITAL } : { ...EMPTY_LAB });
    setModal(true);
  };

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await addRecord(form);
      await load();
      setModal(false);
      toast.success('Record saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!confirm('Delete this record?')) return;
    await deleteRecord(id);
    setRecords(r => r.filter(x => x.id !== id));
    toast.success('Deleted');
  };

  const shown = filter === 'all' ? records : records.filter(r => r.record_type === filter);

  return { records, loading, modal, setModal, tab, form, saving, filter, setFilter, openModal, handle, save, del, shown };
}
