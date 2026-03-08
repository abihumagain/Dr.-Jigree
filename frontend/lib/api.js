import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Inject token on every request
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('drjigree_token');
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default api;
