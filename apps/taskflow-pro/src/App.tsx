import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { useTaskStore } from './store/taskStore';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Categories = lazy(() => import('./pages/Categories'));
const Settings = lazy(() => import('./pages/Settings'));

const App: React.FC = () => {
  useEffect(() => {
    const checkAlarms = () => {
      useTaskStore.getState().checkReminders();
    };

    // Run immediately on mount to check if any alarms are active
    checkAlarms();
    const interval = setInterval(checkAlarms, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen w-full bg-background text-brand-400">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <span className="text-4xl">⚡</span>
          <span className="text-sm tracking-widest font-bold">INITIALIZING CORE...</span>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="categories" element={<Categories />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
