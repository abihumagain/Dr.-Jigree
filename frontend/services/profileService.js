import api from '@/lib/api';

export const getProfile     = ()       => api.get('/profile').then(r => r.data);
export const updateProfile  = (data)   => api.put('/profile', data).then(r => r.data);
export const uploadPicture  = (formData) =>
  api.post('/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
