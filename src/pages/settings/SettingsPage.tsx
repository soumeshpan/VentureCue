import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useSessionStore } from '../../store/sessionStore';
import { useReviewStore } from '../../store/reviewStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { NvidiaNimService } from '../../services/ai/NvidiaNimService';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuthStore();
  const { clearAllSessions } = useSessionStore();
  const { clearAllReviews } = useReviewStore();
  const navigate = useNavigate();
  const [apiKeyInput, setApiKeyInput] = useState(NvidiaNimService.getApiKey());
  const [keySavedNotice, setKeySavedNotice] = useState(false);
  const [dataClearedNotice, setDataClearedNotice] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1>Settings</h1>
        <p>Manage your account and preferences.</p>
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

      {/* AI Provider Integration */}
      <section className="settings-section" aria-labelledby="ai-title">
        <h2 id="ai-title" className="settings-section__title">AI Provider &amp; Model Integration</h2>
        <Card variant="elevated">
          <p className="settings-section__desc">
            VentureCue is powered by <strong>NVIDIA NIM</strong> (Meta Llama 3.2 11B Vision Instruct) for real-time persona intelligence and adaptive dialogue.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Connected Provider</span>
                <strong style={{ fontSize: '0.95rem', color: '#00cba8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00cba8', display: 'inline-block' }} />
                  NVIDIA NIM · {NvidiaNimService.getModel()}
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>API Key Status</span>
                <code style={{ fontSize: '0.85rem', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                  {NvidiaNimService.maskApiKey(apiKeyInput || undefined)}
                </code>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Input
                label="Update NVIDIA API Key"
                type="password"
                placeholder="nvapi-..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                hint="Enter your NVIDIA Cloud Functions / NIM API key."
              />
              <div style={{ alignSelf: 'flex-end', paddingBottom: '2px' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    NvidiaNimService.setApiKey(apiKeyInput);
                    setKeySavedNotice(true);
                    setTimeout(() => setKeySavedNotice(false), 3000);
                  }}
                >
                  Save Key
                </Button>
              </div>
            </div>
            {keySavedNotice && (
              <p style={{ color: '#00cba8', fontSize: '0.85rem', margin: 0 }}>✓ NVIDIA API Key updated successfully.</p>
            )}
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
      <section className="settings-section settings-section--danger" aria-labelledby="danger-title">
        <h2 id="danger-title" className="settings-section__title settings-section__title--danger">Danger zone</h2>
        <Card variant="elevated" className="settings-danger-card">
          <div className="settings-danger-row">
            <div>
              <p className="settings-danger-row__label">Delete all session data</p>
              <p className="settings-danger-row__desc">Permanently removes all your practice sessions, transcripts, and insights. Resets your history to a fresh clean state.</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                clearAllSessions();
                clearAllReviews();
                setDataClearedNotice(true);
                setTimeout(() => setDataClearedNotice(false), 4000);
              }}
            >
              Delete data
            </Button>
          </div>
          {dataClearedNotice && (
            <p style={{ color: '#00cba8', fontSize: '0.85rem', marginTop: '12px', marginBottom: 0 }}>
              ✓ All practice sessions and review records have been cleared.
            </p>
          )}
        </Card>
      </section>
    </div>
  );
};
