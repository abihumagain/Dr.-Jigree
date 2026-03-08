import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, Gift } from 'lucide-react';

const TYPE_ICONS = {
  welcome: Gift,
  info:    Info,
  warning: AlertTriangle,
  success: CheckCircle2,
};
const TYPE_COLORS = {
  welcome: 'bg-purple-50 border-purple-100',
  info:    'bg-blue-50 border-blue-100',
  warning: 'bg-yellow-50 border-yellow-100',
  success: 'bg-green-50 border-green-100',
};
const ICON_COLORS = {
  welcome: 'text-purple-500',
  info:    'text-blue-500',
  warning: 'text-yellow-500',
  success: 'text-green-500',
};

export default function Notifications() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    api.get('/notifications').then(r => setNotifs(r.data)).finally(() => setLoading(false));
  }, [ready, user]);

  const markRead = async id => {
    await api.put(`/notifications/${id}/read`);
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: 1 } : n));
  };

  const markAll = async () => {
    await api.put('/notifications/read-all');
    setNotifs(ns => ns.map(n => ({ ...n, read: 1 })));
    toast.success('All marked as read');
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <Layout title="Notifications">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
            {unread > 0 && <p className="text-sm text-slate-500 mt-1">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button onClick={markAll} className="btn-secondary text-sm flex items-center gap-2">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="card text-center py-16">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map(n => {
              const Icon  = TYPE_ICONS[n.type] || Info;
              const bg    = TYPE_COLORS[n.type] || TYPE_COLORS.info;
              const icol  = ICON_COLORS[n.type] || ICON_COLORS.info;
              return (
                <div key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`card border cursor-pointer transition-all ${bg} ${!n.read ? 'shadow-sm' : 'opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${icol}`} />
                    <div className="flex-1">
                      <p className={`text-sm ${!n.read ? 'font-medium text-slate-800' : 'text-slate-600'}`}>{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
