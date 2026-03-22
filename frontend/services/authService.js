import api from '@/lib/api';

export const loginUser  = (credentials) => api.post('/auth/login',  credentials).then(r => r.data);
export const signupUser = (data)        => api.post('/auth/signup', data).then(r => r.data);
