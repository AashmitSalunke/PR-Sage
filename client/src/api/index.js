import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ra_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — remove stale token
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ra_token');
      // Let the AuthContext hydration handle the redirect
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewAPI = {
  getReview: (id) => api.get(`/reviews/${id}`),
  postComments: (id) => api.post(`/reviews/${id}/post-comments`),
};

// ── History ───────────────────────────────────────────────────────────────────
export const historyAPI = {
  getHistory: (page = 1, limit = 10) =>
    api.get('/history', { params: { page, limit } }),
  deleteReview: (id) => api.delete(`/history/${id}`),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

export default api;
