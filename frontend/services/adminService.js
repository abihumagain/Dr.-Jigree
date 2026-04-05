import api from '@/lib/api';

export const getAdminStats   = ()         => api.get('/admin/stats').then(r => r.data);
export const getAdminUsers   = ()         => api.get('/admin/users').then(r => r.data);
export const getAdminUser    = (id)       => api.get(`/admin/users/${id}`).then(r => r.data);
export const updateAdminUser = (id, data) => api.put(`/admin/users/${id}`, data).then(r => r.data);
export const deleteAdminUser = (id)       => api.delete(`/admin/users/${id}`).then(r => r.data);
export const resetPassword   = (id, password) => api.post(`/admin/users/${id}/reset-password`, { password }).then(r => r.data);
export const impersonate     = (id)       => api.post(`/admin/users/${id}/impersonate`).then(r => r.data);
export const createAdmin     = (email)    => api.post('/admin/create-admin', { email }).then(r => r.data);
