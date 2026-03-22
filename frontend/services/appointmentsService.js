import api from '@/lib/api';

export const getAppointments   = ()          => api.get('/appointments').then(r => r.data);
export const addAppointment    = (data)      => api.post('/appointments', data).then(r => r.data);
export const updateAppointment = (id, data)  => api.put(`/appointments/${id}`, data).then(r => r.data);
export const deleteAppointment = (id)        => api.delete(`/appointments/${id}`).then(r => r.data);
