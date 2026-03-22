import api from '@/lib/api';

export const getDashboard = () => api.get('/dashboard').then(r => r.data);
