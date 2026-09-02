import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  History,
  Lightbulb,
  ClipboardCheck,
  LineChart,
  ShieldCheck,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ResponsibleAIModal } from '../shared/ResponsibleAIModal';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/discovery/new', icon: Users, label: 'Customer Discovery' },
  { to: '/pitch/new', icon: TrendingUp, label: 'Investor Pitch' },
  { to: '/progress', icon: LineChart, label: 'Progress & Trends' },
  { to: '/sessions', icon: History, label: 'Sessions' },
  { to: '/insights', icon: Lightbulb, label: 'Insights' },
  { to: '/reviews', icon: ClipboardCheck, label: 'Human Review' },
];

const BOTTOM_ITEMS = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [showRaiModal, setShowRaiModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo" aria-hidden="true">
          <Zap size={18} />
        </div>
        <span className="sidebar__brand-name">VentureCue</span>
      </div>

      {/* Primary Nav */}
      <nav className="sidebar__nav">
        <ul className="sidebar__list" role="list">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
                end={item.to === '/dashboard'}
              >
                <item.icon size={18} aria-hidden="true" />
                <span className="sidebar__link-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="sidebar__bottom">
        <ul className="sidebar__list" role="list">
          <li>
            <button
              type="button"
              className="sidebar__link sidebar__link--rai"
              onClick={() => setShowRaiModal(true)}
              title="Responsible AI, Safety & Privacy guidelines"
            >
              <ShieldCheck size={18} aria-hidden="true" />
              <span className="sidebar__link-label">Responsible AI</span>
            </button>
          </li>
          {BOTTOM_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                }
              >
                <item.icon size={18} aria-hidden="true" />
                <span className="sidebar__link-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* User profile */}
        <div className="sidebar__user">
          <div className="sidebar__user-avatar" aria-hidden="true">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user?.name ?? 'Founder'}</span>
            <span className="sidebar__user-email">{user?.startupName ?? 'VentureCue'}</span>
          </div>
          <button
            className="sidebar__logout"
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Responsible AI Information Modal */}
      <ResponsibleAIModal
        isOpen={showRaiModal}
        onClose={() => setShowRaiModal(false)}
      />
    </aside>
  );
};
