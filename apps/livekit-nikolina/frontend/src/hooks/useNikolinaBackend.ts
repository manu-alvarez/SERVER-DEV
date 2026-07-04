import { useState, useCallback, useEffect } from 'react';

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '/_nikolina/api';

export function useNikolinaBackend() {
  const [isConnectedBackend, setIsConnectedBackend] = useState(false);
  const [token, setToken] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [restaurantInfo, setRestaurantInfo] = useState<any>({ name: 'Cargando...', address: '' });
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [loginError, setLoginError] = useState('');

  // Initial Health Check
  useEffect(() => {
    fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) })
      .then(r => {
        if (r.ok) setIsConnectedBackend(true);
      })
      .catch(() => setIsConnectedBackend(false));
  }, []);

  const fetchData = useCallback(async () => {
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    try {
      const p1 = fetch(`${API_BASE}/restaurant`, { headers }).then(r => r.json());
      const p2 = fetch(`${API_BASE}/menu`, { headers }).then(r => r.json());
      const p3 = fetch(`${API_BASE}/reservations`, { headers }).then(r => r.json());
      const p4 = fetch(`${API_BASE}/calls`, { headers }).then(r => r.json());
      const [rest, menuData, resData, callsData] = await Promise.all([p1, p2, p3, p4]);
      
      setRestaurantInfo(rest || { name: 'Restaurante MSB', address: 'Sevilla' });
      setMenuItems(Array.isArray(menuData) ? menuData : []);
      setReservations(Array.isArray(resData) ? resData : []);
      setCalls(Array.isArray(callsData) ? callsData : []);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  }, [token]);

  useEffect(() => {
    if (isConnectedBackend && isLoggedIn) {
      fetchData();
    }
  }, [isConnectedBackend, isLoggedIn, fetchData]);

  const login = async (password: string) => {
    setIsLoggingIn(true);
    setLoginError('');
    const formData = new URLSearchParams();
    formData.append('username', 'admin');
    formData.append('password', password);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setIsLoggedIn(true);
      } else {
        setLoginError('Credenciales incorrectas');
      }
    } catch (err) {
      setLoginError('Error de conexión');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const generateLivekitToken = async (participantName: string) => {
    const res = await fetch(`${API_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: 'nikolina-room',
        participant_identity: participantName
      })
    });
    if (!res.ok) throw new Error('Error al generar token');
    const data = await res.json();
    return data.token;
  };

  return {
    isConnectedBackend,
    isLoggedIn,
    isLoggingIn,
    loginError,
    restaurantInfo,
    menuItems,
    reservations,
    calls,
    login,
    generateLivekitToken,
    refreshData: fetchData
  };
}
