import api from '@/lib/api';

export const getDashboard = () => api.get('/dashboard').then(r => r.data);

/** Fetch all data needed for the PDF export in one parallel call */
export const getDashboardExportData = () => Promise.all([
  api.get('/profile').then(r => r.data),
  api.get('/medications').then(r => r.data.filter(m => m.active)),
  api.get('/appointments').then(r => r.data.filter(a => a.status === 'scheduled' && a.appointment_date >= new Date().toISOString().slice(0, 10))),
  api.get('/health-records').then(r => r.data.slice(0, 20)),
]).then(([profile, medications, appointments, records]) => ({ profile, medications, appointments, records }));
