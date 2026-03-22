import api from '@/lib/api';

export const getDocuments   = ()            => api.get('/documents').then(r => r.data);
export const uploadDocument = (formData)    =>
  api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
export const deleteDocument = (id)          => api.delete(`/documents/${id}`).then(r => r.data);
