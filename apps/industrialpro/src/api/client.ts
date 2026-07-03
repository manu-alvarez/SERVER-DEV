import axios from 'axios';

const API = '/_industrialpro/api';

let _token: string | null = localStorage.getItem('industrialpro_token');

export function setToken(t: string | null) {
  _token = t;
  if (t) localStorage.setItem('industrialpro_token', t);
  else localStorage.removeItem('industrialpro_token');
}

export function getToken() { return _token; }

const api = axios.create({ baseURL: API });

api.interceptors.request.use(config => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      setToken(null);
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;
