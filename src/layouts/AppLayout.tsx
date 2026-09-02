import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/nav/Sidebar';
import { MobileNav } from '../components/nav/MobileNav';
import { useAuthStore } from '../store/authStore';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAuthenticated && user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-layout__main" id="main-content">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
};
