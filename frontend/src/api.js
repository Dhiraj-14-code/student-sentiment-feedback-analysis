import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = (username, password) => {
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  return api.post('/auth/login', params);
};

export const register = (email, password, is_admin) =>
  api.post('/auth/register', { email, password, is_admin });

export const getMe = () => api.get('/auth/me');

export const submitFeedback = (data) => api.post('/feedback', data);
export const getAllFeedback = () => api.get('/feedback');
export const getAnalyticsOverview = () => api.get('/analytics/overview');
export const getAnalyticsSentiment = () => api.get('/analytics/sentiment');
export const getAnalyticsTopics = () => api.get('/analytics/topics');
export const getAnalyticsTrends = () => api.get('/analytics/trends');
export const getEmergingIssues = () => api.get('/analytics/emerging-issues');
export const getAspectHealth = () => api.get('/analytics/aspect-health');
export const getIssues = () => api.get('/issues');
export const getIssue = (id) => api.get(`/issues/${id}`);
export const getIssueFeedbacks = (id) => api.get(`/issues/${id}/feedbacks`);
export const updateIssueStatus = (id, status, admin_notes) =>
  api.patch(`/issues/${id}/status`, { status, admin_notes });
export const recordIntervention = (id, data) =>
  api.post(`/issues/${id}/intervention`, data);

export default api;