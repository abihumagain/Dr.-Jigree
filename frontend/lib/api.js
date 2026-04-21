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

// Force logout on 401 (expired / invalid token) — but NOT on auth endpoints
// (a failed login also returns 401, and we want the page to handle that itself)
api.interceptors.response.use(
  res => res,
  err => {
    const isAuthEndpoint = err?.config?.url?.startsWith('/auth/');
    const status = err?.response?.status;
    if (typeof window !== 'undefined') {
      if (status === 401 && !isAuthEndpoint) {
        localStorage.removeItem('drjigree_token');
        localStorage.removeItem('drjigree_user');
        delete axios.defaults.headers.common['Authorization'];
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
      if (status === 403) {
        // Likely an impersonation token used against an admin endpoint — restore admin session
        const adminTok  = localStorage.getItem('drjigree_admin_token');
        const adminUsr  = localStorage.getItem('drjigree_admin_user');
        if (adminTok && adminUsr) {
          localStorage.setItem('drjigree_token', adminTok);
          localStorage.setItem('drjigree_user',  adminUsr);
          localStorage.removeItem('drjigree_admin_token');
          localStorage.removeItem('drjigree_admin_user');
          window.location.href = '/admin/users';
          return Promise.reject(err);
        }
        // No admin backup — redirect to dashboard
        window.location.href = '/dashboard';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
