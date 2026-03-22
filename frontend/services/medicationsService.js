import api from '@/lib/api';

export const getMedications    = ()          => api.get('/medications').then(r => r.data);
export const addMedication     = (data)      => api.post('/medications', data).then(r => r.data);
export const updateMedication  = (id, data)  => api.put(`/medications/${id}`, data).then(r => r.data);
export const deleteMedication  = (id)        => api.delete(`/medications/${id}`).then(r => r.data);
