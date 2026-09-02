import React from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { X, Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import './SessionLayout.css';

export const SessionLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="session-layout">
      <header className="session-layout__header">
        <div className="session-layout__brand">
          <div className="session-layout__logo">
            <Zap size={14} />
          </div>
          <span className="session-layout__brand-name">VentureCue</span>
        </div>
        <button
          className="session-layout__exit"
          onClick={() => navigate(-1)}
          aria-label="Exit session"
          title="Exit session"
        >
          <X size={18} />
          <span>Exit</span>
        </button>
      </header>

      <main className="session-layout__main" id="main-content">
        <Outlet />
      </main>
    </div>
  );
};
