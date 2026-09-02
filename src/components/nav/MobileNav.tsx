import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, History, Lightbulb } from 'lucide-react';
import './MobileNav.css';

const ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/discovery/new', icon: Users, label: 'Discovery' },
  { to: '/pitch/new', icon: TrendingUp, label: 'Pitch' },
  { to: '/sessions', icon: History, label: 'Sessions' },
  { to: '/insights', icon: Lightbulb, label: 'Insights' },
];

export const MobileNav: React.FC = () => (
  <nav className="mobile-nav" role="navigation" aria-label="Mobile navigation">
    <ul className="mobile-nav__list" role="list">
      {ITEMS.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            className={({ isActive }) =>
              `mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`
            }
            end={item.to === '/dashboard'}
          >
            <item.icon size={20} aria-hidden="true" />
            <span className="mobile-nav__label">{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);
