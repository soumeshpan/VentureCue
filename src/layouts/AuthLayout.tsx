import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './AuthLayout.css';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <div className="auth-layout__logo">
          <Zap size={20} />
        </div>
        <span className="auth-layout__brand-name">VentureCue</span>
      </div>
      <div className="auth-layout__card">
        <Outlet />
      </div>
      <p className="auth-layout__footer">
        Prepare for the conversations that matter.
      </p>
    </div>
  );
};
