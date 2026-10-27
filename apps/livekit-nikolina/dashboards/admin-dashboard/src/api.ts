import axios from 'axios';

// In production this should point to the public domain or VITE_API_URL
// For now we use the relative path if served from the same Nginx,
// or the direct domain for local development.
const baseURL = import.meta.env.VITE_API_URL || 'https://livekit.alvarezconsult.com/api';

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

export const login = (data: URLSearchParams) => api.post('/login', data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});

export const getStats = (date?: string) => api.get('/stats', { params: { date } });
export const getReservations = (date?: string, status?: string) => api.get('/reservations', { params: { date, status } });
export const createReservation = (data: any) => api.post('/reservations', data);
export const cancelReservation = (id: number) => api.delete(`/reservations/${id}`);

export const getTables = (active_only = false) => api.get('/tables', { params: { active_only } });
export const createTable = (data: any) => api.post('/tables', data);
export const updateTable = (id: number, data: any) => api.put(`/tables/${id}`, data);
export const deleteTable = (id: number) => api.delete(`/tables/${id}`);

export const getRestaurantInfo = () => api.get('/restaurant');
export const updateRestaurantInfo = (data: any) => api.put('/restaurant', data);

export const getCalls = (limit = 50) => api.get('/calls', { params: { limit } });

export const getMenu = (category?: string, available_only = true) => api.get('/menu', { params: { category, available_only } });
export const createMenuItem = (data: any) => api.post('/menu', data);
export const updateMenuItem = (id: number, data: any) => api.put(`/menu/${id}`, data);
export const deleteMenuItem = (id: number) => api.delete(`/menu/${id}`);
