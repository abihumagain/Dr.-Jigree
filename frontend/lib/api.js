import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Inject token on every request (read dynamically so post-login calls work)
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('drjigree_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Force logout on 401 (expired / invalid token)
api.interceptors.response.use(
  res => res,
  err => {
    if (typeof window !== 'undefined' && err?.response?.status === 401) {
      localStorage.removeItem('drjigree_token');
      localStorage.removeItem('drjigree_user');
      delete axios.defaults.headers.common['Authorization'];
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
