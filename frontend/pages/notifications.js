import Layout from '@/components/Layout';
import { useNotifications } from '@/controllers/useNotifications';
import { fmtDateTime } from '@/lib/date';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle2, Gift } from 'lucide-react';

const TYPE_ICONS = {
  welcome: Gift,
  info:    Info,
  warning: AlertTriangle,
  success: CheckCircle2,
};
const TYPE_COLORS = {
  welcome: 'bg-purple-900/20 border-purple-700/50',
  info:    'bg-brand-500/10 border-brand-600/50',
  warning: 'bg-yellow-900/20 border-yellow-700/50',
  success: 'bg-green-900/20 border-green-700/50',
};
const ICON_COLORS = {
  welcome: 'text-purple-400',
  info:    'text-brand-400',
  warning: 'text-yellow-400',
  success: 'text-green-400',
};

export default function Notifications() {
  const { notifs, loading, unread, read, readAll } = useNotifications();

  return (
    <Layout title="Notifications">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Notifications</h2>
            {unread > 0 && <p className="text-sm text-slate-400 mt-1">{unread} unread</p>}
          </div>
          {unread > 0 && (
            <button onClick={readAll} className="btn-secondary text-sm flex items-center gap-2">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="card text-center py-16">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map(n => {
              const Icon = TYPE_ICONS[n.type] || Info;
              const bg   = TYPE_COLORS[n.type] || TYPE_COLORS.info;
              const icol = ICON_COLORS[n.type] || ICON_COLORS.info;
              return (
                <div key={n.id}
                  onClick={() => !n.read && read(n.id)}
                  className={`card border cursor-pointer transition-all ${bg} ${!n.read ? 'shadow-sm' : 'opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${icol}`} />
                    <div className="flex-1">
                      <p className={`text-sm ${!n.read ? 'font-medium text-slate-100' : 'text-slate-400'}`}>{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{fmtDateTime(n.created_at)}</p>
                    </div>
                    {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-brand-400 shrink-0 mt-1" />}
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
