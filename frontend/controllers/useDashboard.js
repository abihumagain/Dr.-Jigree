import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { getDashboard, getDashboardExportData } from '@/services/dashboardService';
import toast from 'react-hot-toast';

export function useDashboard() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    getDashboard().then(setData).finally(() => setLoading(false));
  }, [ready, user]);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const { exportHealthPdf } = await import('@/lib/exportPdf');
      const extra = await getDashboardExportData();
      await exportHealthPdf({
        user:         extra.profile,
        assessment:   data?.latestAssessment ?? null,
        medications:  extra.medications,
        appointments: extra.appointments,
        records:      extra.records,
      });
      toast.success('PDF downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  };

  return { data, loading, user, exporting, exportPdf };
}
