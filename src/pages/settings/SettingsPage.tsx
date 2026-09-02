import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { useReviewStore } from '../../store/reviewStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { NvidiaNimService } from '../../services/ai/NvidiaNimService';
import { ShieldCheck, Server, Cpu } from 'lucide-react';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuthStore();
  const { clearAllSessions } = useSessionStore();
  const { clearAllReviews } = useReviewStore();
  const navigate = useNavigate();
  const [dataClearedNotice, setDataClearedNotice] = useState(false);
  const [serverStatus, setServerStatus] = useState<{
    provider: string;
    model: string;
    isConfigured: boolean;
    configuredVia: string;
  }>({
    provider: 'NVIDIA NIM',
    model: NvidiaNimService.getModel(),
    isConfigured: true,
    configuredVia: 'Server Environment (NVIDIA_API_KEY)',
  });

  useEffect(() => {
    NvidiaNimService.checkServerStatus().then(setServerStatus);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1>Settings</h1>
        <p>Manage your account, audio preferences, and AI infrastructure.</p>
      </div>

      {/* Profile */}
      <section className="settings-section" aria-labelledby="profile-title">
        <h2 id="profile-title" className="settings-section__title">Profile</h2>
        <Card variant="elevated">
          <div className="settings-form">
            <Input
              label="Full name"
              value={user?.name ?? ''}
              onChange={e => updateProfile({ name: e.target.value })}
              hint="This is shown throughout the app."
            />
            <Input
              label="Email"
              type="email"
              value={user?.email ?? ''}
              disabled
              hint="Email cannot be changed in this version."
            />
            <Input
              label="Startup name"
              value={user?.startupName ?? ''}
              onChange={e => updateProfile({ startupName: e.target.value })}
              placeholder="Your startup name"
            />
          </div>
        </Card>
      </section>

      {/* AI Provider Infrastructure & Server-Side Security */}
      <section className="settings-section" aria-labelledby="ai-title">
        <h2 id="ai-title" className="settings-section__title">AI Provider &amp; Model Infrastructure</h2>
        <Card variant="elevated">
          <p className="settings-section__desc">
            VentureCue is powered by <strong>NVIDIA NIM</strong> (Meta Llama 3.2 11B Vision Instruct) running on server-side NVIDIA Cloud Functions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Connected Provider</span>
                <strong style={{ fontSize: '0.95rem', color: '#00cba8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={16} />
                  {serverStatus.provider} · {serverStatus.model}
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Configuration Mode</span>
                <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                  <Server size={12} />
                  Configured by server environment
                </span>
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(0, 203, 168, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 203, 168, 0.2)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <ShieldCheck size={20} color="#00cba8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>Server-Side Secret Isolation Active</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  The NVIDIA API key is managed exclusively via the backend server environment (<code>NVIDIA_API_KEY</code>). API credentials are never exposed to the client browser, localStorage, or frontend JavaScript bundles.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Microphone */}
      <section className="settings-section" aria-labelledby="audio-title">
        <h2 id="audio-title" className="settings-section__title">Audio &amp; Microphone</h2>
        <Card variant="elevated">
          <p className="settings-section__desc">
            VentureCue uses your microphone for voice input during practice sessions.
            If voice isn't working, you can always use the text input fallback.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigator.mediaDevices?.getUserMedia({ audio: true })}
          >
            Test microphone access
          </Button>
        </Card>
      </section>

      {/* Account */}
      <section className="settings-section" aria-labelledby="account-title">
        <h2 id="account-title" className="settings-section__title">Account</h2>
        <Card variant="elevated">
          <div className="settings-account">
            <div>
              <p className="settings-account__name">{user?.name}</p>
              <p className="settings-account__email">{user?.email}</p>
            </div>
            <Button variant="ghost" onClick={handleLogout}>Sign out</Button>
          </div>
        </Card>
      </section>

      {/* Danger zone */}
      <section className="settings-section" aria-labelledby="danger-title">
        <h2 id="danger-title" className="settings-section__title settings-section__title--danger">
          Danger zone
        </h2>
        <Card variant="default">
          <p className="settings-section__desc">
            Clear all saved practice sessions and evaluation audit trails. This action cannot be undone.
          </p>
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all practice data?')) {
                clearAllSessions();
                clearAllReviews();
                setDataClearedNotice(true);
                setTimeout(() => setDataClearedNotice(false), 3000);
              }
            }}
          >
            Clear all session data
          </Button>
          {dataClearedNotice && (
            <p style={{ color: 'var(--status-error)', fontSize: '0.85rem', marginTop: '8px' }}>
              All local session records have been wiped.
            </p>
          )}
        </Card>
      </section>
    </div>
  );
};
