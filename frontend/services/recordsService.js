import api from '@/lib/api';

export const getRecords   = ()       => api.get('/health-records').then(r => r.data);
export const addRecord    = (data)   => api.post('/health-records', data).then(r => r.data);
export const deleteRecord = (id)     => api.delete(`/health-records/${id}`).then(r => r.data);
