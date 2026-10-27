import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Tables from './pages/Tables';
import Settings from './pages/Settings';
import Calls from './pages/Calls';
import MenuPage from './pages/MenuPage';
import Login from './pages/Login';

const RequireAuth = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <Outlet />;
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="reservations" element={<Reservations />} />
                    <Route path="tables" element={<Tables />} />
                    <Route path="menu" element={<MenuPage />} />
                    <Route path="calls" element={<Calls />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
