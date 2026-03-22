import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getProfile, updateProfile, uploadPicture } from '@/services/profileService';
import { getDashboard } from '@/services/dashboardService';

export function useProfile() {
  const { user, ready, updateUser } = useAuth();
  const router = useRouter();
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [stats, setStats]     = useState(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    Promise.all([getProfile(), getDashboard()])
      .then(([profile, dashboard]) => { setForm(profile); setStats(dashboard); })
      .finally(() => setLoading(false));
  }, [ready, user]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await updateProfile(form);
      updateUser(data);
      toast.success('Profile updated');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const changePicture = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('picture', file);
    try {
      const data = await uploadPicture(fd);
      setForm(f => ({ ...f, profile_picture: data.profile_picture }));
      updateUser({ ...user, profile_picture: data.profile_picture });
      toast.success('Profile picture updated');
    } catch { toast.error('Upload failed'); }
  };

  return { form, loading, saving, stats, handle, save, changePicture };
}
