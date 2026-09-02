import React from 'react';
import './Badge.css';

export type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'discovery' | 'pitch';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
}) => (
  <span className={`badge badge--${variant} badge--${size}`}>
    {dot && <span className="badge__dot" aria-hidden="true" />}
    {children}
  </span>
);
