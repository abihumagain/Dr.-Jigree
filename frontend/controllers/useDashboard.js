import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { getDashboard } from '@/services/dashboardService';

export function useDashboard() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    getDashboard().then(setData).finally(() => setLoading(false));
  }, [ready, user]);

  return { data, loading, user };
}
