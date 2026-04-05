import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import {
  getAdminStats, getAdminUsers, getAdminUser,
  updateAdminUser, deleteAdminUser, resetPassword, impersonate, createAdmin,
} from '@/services/adminService';
import toast from 'react-hot-toast';

// ── Admin stats / overview ────────────────────────────────────────────────────
export function useAdminStats() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user)           { router.push('/login'); return; }
    if (!user.is_admin)  { router.push('/dashboard'); return; }
    getAdminStats().then(setStats).finally(() => setLoading(false));
  }, [ready, user]);

  return { stats, loading };
}

// ── Users list ────────────────────────────────────────────────────────────────
export function useAdminUsers() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all'); // all | admin | inactive

  useEffect(() => {
    if (!ready) return;
    if (!user)          { router.push('/login'); return; }
    if (!user.is_admin) { router.push('/dashboard'); return; }
    getAdminUsers().then(setUsers).finally(() => setLoading(false));
  }, [ready, user]);

  const toggleAdmin = async (id, current) => {
    const updated = await updateAdminUser(id, { is_admin: current ? 0 : 1 });
    setUsers(us => us.map(u => u.id === id ? { ...u, ...updated } : u));
    toast.success(current ? 'Admin rights removed' : 'Admin rights granted');
  };

  const toggleActive = async (id, current) => {
    const updated = await updateAdminUser(id, { is_active: current ? 0 : 1 });
    setUsers(us => us.map(u => u.id === id ? { ...u, ...updated } : u));
    toast.success(current ? 'User suspended' : 'User reactivated');
  };

  const remove = async (id) => {
    if (!confirm('Permanently delete this user and ALL their data? This cannot be undone.')) return;
    await deleteAdminUser(id);
    setUsers(us => us.filter(u => u.id !== id));
    toast.success('User deleted');
  };

  const doImpersonate = async (id) => {
    const { token, user: u } = await impersonate(id);
    // Store original admin token so we can restore later
    localStorage.setItem('drjigree_admin_token', localStorage.getItem('drjigree_token'));
    localStorage.setItem('drjigree_admin_user',  localStorage.getItem('drjigree_user'));
    localStorage.setItem('drjigree_token', token);
    localStorage.setItem('drjigree_user',  JSON.stringify(u));
    toast.success(`Viewing app as ${u.full_name}`);
    router.push('/dashboard');
  };

  const shown = users.filter(u => {
    const matchFilter = filter === 'all' ? true : filter === 'admin' ? u.is_admin : !u.is_active;
    const q = search.toLowerCase();
    const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return { users, shown, loading, search, setSearch, filter, setFilter, toggleAdmin, toggleActive, remove, doImpersonate };
}

// ── Single user detail ────────────────────────────────────────────────────────
export function useAdminUserDetail(id) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwModal, setPwModal] = useState(false);
  const [newPw, setNewPw]     = useState('');
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!ready || !id) return;
    if (!user)          { router.push('/login'); return; }
    if (!user.is_admin) { router.push('/dashboard'); return; }
    getAdminUser(id).then(setDetail).finally(() => setLoading(false));
  }, [ready, user, id]);

  const doResetPassword = async () => {
    if (newPw.length < 8) { toast.error('Min 8 characters'); return; }
    setSaving(true);
    try {
      await resetPassword(id, newPw);
      toast.success('Password reset successfully');
      setPwModal(false); setNewPw('');
    } catch { toast.error('Failed to reset password'); }
    finally { setSaving(false); }
  };

  const doPromote = async () => {
    const updated = await updateAdminUser(id, { is_admin: 1 });
    setDetail(d => ({ ...d, user: { ...d.user, ...updated } }));
    toast.success('User promoted to admin');
  };

  const doSuspend = async () => {
    const current = detail?.user?.is_active;
    const updated = await updateAdminUser(id, { is_active: current ? 0 : 1 });
    setDetail(d => ({ ...d, user: { ...d.user, ...updated } }));
    toast.success(current ? 'User suspended' : 'User reactivated');
  };

  return { detail, loading, pwModal, setPwModal, newPw, setNewPw, saving, doResetPassword, doPromote, doSuspend };
}

// ── First-time promote-self utility ──────────────────────────────────────────
export function useAdminSetup() {
  const [email, setEmail]   = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const promote = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await createAdmin(email);
      setResult(r.message);
      toast.success(r.message);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed');
    } finally { setLoading(false); }
  };

  return { email, setEmail, result, loading, promote };
}
