import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    // Unwrap Spring Boot Result<T> envelope: { code, message, data }
    if (res.data && typeof res.data === 'object' && 'data' in res.data && 'code' in res.data) {
      res.data = res.data.data;
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_username');
      localStorage.removeItem('admin_role');
      localStorage.removeItem('admin_hospital_id');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
