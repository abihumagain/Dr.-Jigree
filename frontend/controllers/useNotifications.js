import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getNotifications, markRead, markAllRead } from '@/services/notificationsService';

export function useNotifications() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    getNotifications().then(setNotifs).finally(() => setLoading(false));
  }, [ready, user]);

  const read = async id => {
    await markRead(id);
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: 1 } : n));
  };

  const readAll = async () => {
    await markAllRead();
    setNotifs(ns => ns.map(n => ({ ...n, read: 1 })));
    toast.success('All marked as read');
  };

  const unread = notifs.filter(n => !n.read).length;

  return { notifs, loading, unread, read, readAll };
}
