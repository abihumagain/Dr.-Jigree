import api from '@/lib/api';

export const generatePlan  = (data)   => api.post('/workouts/generate', data).then(r => r.data);
export const getActivePlan = ()       => api.get('/workouts/plan').then(r => r.data);
export const getPlans      = ()       => api.get('/workouts/plans').then(r => r.data);
export const deletePlan    = (id)     => api.delete(`/workouts/plan/${id}`).then(r => r.data);
export const logWorkout    = (data)   => api.post('/workouts/log', data).then(r => r.data);
export const unlogWorkout  = (id)     => api.delete(`/workouts/log/${id}`).then(r => r.data);
export const getStats      = ()       => api.get('/workouts/stats').then(r => r.data);
