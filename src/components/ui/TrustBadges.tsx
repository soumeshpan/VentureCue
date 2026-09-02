/**
 * VentureCue — Responsible AI Trust & Provenance Badges
 * Standardized status labels distinguishing AI generation, simulation, and human review states.
 */

import React from 'react';
import { Sparkles, ShieldCheck, Edit3, XCircle, Users, TrendingUp, Info } from 'lucide-react';
import './TrustBadges.css';

export type TrustBadgeType =
  | 'ai-generated'
  | 'human-reviewed'
  | 'human-edited'
  | 'ai-rejected'
  | 'simulated-customer'
  | 'simulated-investor';

interface TrustBadgeProps {
  type: TrustBadgeType;
  reviewerName?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  type,
  reviewerName,
  size = 'md',
  className = '',
}) => {
  const sizeClass = size === 'sm' ? 'trust-badge--sm' : '';

  switch (type) {
    case 'ai-generated':
      return (
        <span className={`trust-badge trust-badge--ai ${sizeClass} ${className}`}>
          <Sparkles size={size === 'sm' ? 11 : 13} className="trust-badge__icon" />
          <span>AI GENERATED</span>
        </span>
      );

    case 'human-reviewed':
      return (
        <span className={`trust-badge trust-badge--reviewed ${sizeClass} ${className}`}>
          <ShieldCheck size={size === 'sm' ? 11 : 13} className="trust-badge__icon" />
          <span>HUMAN REVIEWED{reviewerName ? ` (${reviewerName})` : ''}</span>
        </span>
      );

    case 'human-edited':
      return (
        <span className={`trust-badge trust-badge--edited ${sizeClass} ${className}`}>
          <Edit3 size={size === 'sm' ? 11 : 13} className="trust-badge__icon" />
          <span>HUMAN EDITED</span>
        </span>
      );

    case 'ai-rejected':
      return (
        <span className={`trust-badge trust-badge--rejected ${sizeClass} ${className}`}>
          <XCircle size={size === 'sm' ? 11 : 13} className="trust-badge__icon" />
          <span>AI EVALUATION REJECTED</span>
        </span>
      );

    case 'simulated-customer':
      return (
        <span className={`trust-badge trust-badge--sim-cust ${sizeClass} ${className}`}>
          <Users size={size === 'sm' ? 11 : 13} className="trust-badge__icon" />
          <span>SIMULATED CUSTOMER</span>
        </span>
      );

    case 'simulated-investor':
      return (
        <span className={`trust-badge trust-badge--sim-inv ${sizeClass} ${className}`}>
          <TrendingUp size={size === 'sm' ? 11 : 13} className="trust-badge__icon" />
          <span>SIMULATED INVESTOR</span>
        </span>
      );

    default:
      return null;
  }
};
