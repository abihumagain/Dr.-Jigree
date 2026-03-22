import api from '@/lib/api';

export const runAssessment  = (payload) => api.post('/assess',      payload).then(r => r.data);
export const getAssessments = ()        => api.get('/assessments').then(r => r.data);
