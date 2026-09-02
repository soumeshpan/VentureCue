import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Square, TrendingUp, AlertCircle } from 'lucide-react';
import { usePitchStore } from '../../store/pitchStore';
import { useSessionStore } from '../../store/sessionStore';
import { useReviewStore } from '../../store/reviewStore';
import { useAvatar } from '../../hooks/useAvatar';
import { useMicrophone } from '../../hooks/useMicrophone';
import { useSession } from '../../hooks/useSession';
import { getPersonaById } from '../../data/personas';
import { AvatarStage } from '../../components/session/AvatarStage';
import { TranscriptPanel } from '../../components/session/TranscriptPanel';
import { MicControl } from '../../components/session/MicControl';
import { Button } from '../../components/ui/Button';
import { TrustBadge } from '../../components/ui/TrustBadges';
import { ResponsibleAIModal } from '../../components/shared/ResponsibleAIModal';
import { EvaluationService } from '../../services/ai/EvaluationService';
import { TurnDebugBadge } from '../../components/session/TurnDebugBadge';
import type { SessionConfig, Session } from '../../types/session';
import '../discovery/DiscoverySessionPage.css';

export const PitchSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentSetup } = usePitchStore();
  const { activeSession, avatarState, startSession, saveCompletedSession } = useSessionStore();
  const { formattedTime, start, elapsedSeconds } = useSession();
  const { status: micStatus, requestPermission, errorMessage } = useMicrophone();

  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showRaiModal, setShowRaiModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState('Extracting investor dialogue…');
  const sessionInitialized = useRef(false);

  const persona = currentSetup?.personaId
    ? getPersonaById(currentSetup.personaId)
    : getPersonaById('numbers-focused') || {
        id: 'numbers-focused',
        category: 'investor' as const,
        name: 'The Metrics VC',
        tagline: 'Focuses on CAC/LTV and growth trajectory',
        description: 'Probes unit economics and financial defensibility',
        behaviorCues: [],
        traits: [],
        difficulty: 'hard' as const,
        icon: 'TrendingUp',
      };

  const sessionConfig: SessionConfig | null = {
    sessionId: id ?? `pitch-${Date.now()}`,
    type: 'pitch',
    personaId: currentSetup?.personaId || 'numbers-focused',
    difficulty: currentSetup?.difficulty || 'moderate',
    systemPrompt: `You are ${persona?.name}. ${persona?.description}`,
    context: { setup: currentSetup },
  };

  const { sendMessage } = useAvatar(sessionConfig);

  // Extract latest avatar statement for real-time live subtitle banner
  const latestAvatarLine = activeSession?.transcript
    ?.filter((t) => t.speaker === 'avatar')
    .slice(-1)[0]?.text;

  useEffect(() => {
    if (sessionInitialized.current) return;
    sessionInitialized.current = true;

    const newSessionId = id ?? `pitch-${Date.now()}`;

    startSession({
      id: newSessionId,
      type: 'pitch',
      personaId: persona?.id ?? 'numbers-focused',
      personaName: persona?.name ?? 'Investor',
      difficulty: currentSetup?.difficulty ?? 'moderate',
      startedAt: Date.now(),
      startupName: currentSetup?.info?.startupName || 'Your Startup',
      pitchTitle: `${currentSetup?.info?.startupName || 'Startup'} — Investor Defense Q&A`,
      transcript: [],
    });

    start();
    requestPermission();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirmEnd = async () => {
    setShowConfirmEnd(false);
    setIsEnding(true);

    // Multi-phase diagnostic analysis
    setAnalysisPhase('Extracting pitch dialogue & answers…');
    await new Promise((r) => setTimeout(r, 400));
    setAnalysisPhase('Evaluating unit economics & defensibility claims…');
    await new Promise((r) => setTimeout(r, 600));
    setAnalysisPhase('Scoring objection handling & answer precision…');
    await new Promise((r) => setTimeout(r, 500));
    setAnalysisPhase('Generating investor readiness debrief…');
    await new Promise((r) => setTimeout(r, 400));

    const transcript = activeSession?.transcript || [];
    const sessionId = activeSession?.id || id || `pitch-${Date.now()}`;

    // Pitch Evaluation Calculation
    const completedSession: Session = {
      id: sessionId,
      type: 'pitch',
      personaId: persona?.id || 'numbers-focused',
      personaName: persona?.name || 'Investor',
      difficulty: currentSetup?.difficulty || 'moderate',
      startedAt: activeSession?.startedAt || Date.now() - elapsedSeconds * 1000,
      endedAt: Date.now(),
      durationSeconds: Math.max(elapsedSeconds, 15),
      transcript,
      startupName: currentSetup?.info?.startupName || 'Your Startup',
      pitchTitle: `${currentSetup?.info?.startupName || 'Startup'} — Investor Q&A`,
    };

    const debrief = await EvaluationService.evaluatePitchSessionAsync({
      session: completedSession,
      persona: persona || {
        id: 'numbers-focused',
        category: 'investor',
        name: 'The Metrics VC',
        tagline: '',
        description: '',
        behaviorCues: [],
        traits: [],
        difficulty: 'hard',
        icon: 'TrendingUp',
      },
      difficulty: currentSetup?.difficulty || 'moderate',
    });

    completedSession.debrief = debrief;

    saveCompletedSession(completedSession);

    // Create pending Human Review audit record
    useReviewStore.getState().createPendingReview({
      sessionId,
      sessionType: 'pitch',
      startupName: currentSetup?.info?.startupName || 'Your Startup',
      personaName: persona?.name || 'Investor',
      difficulty: currentSetup?.difficulty || 'moderate',
      evaluation: debrief,
    });

    navigate(`/pitch/debrief/${sessionId}`);
  };

  return (
    <div className="session-page">
      {/* End Session Confirmation Modal */}
      {showConfirmEnd && (
        <div className="session-modal-backdrop animate-fade-in">
          <div className="session-modal-card animate-scale-in">
            <div className="session-modal-icon">
              <AlertCircle size={24} />
            </div>
            <h2>End Investor Practice Q&amp;A?</h2>
            <p>
              Your pitch defense with <strong>{persona?.name}</strong> will be analyzed for answer
              precision, financial reasoning, and objection handling.
            </p>
            <div className="session-modal-actions">
              <Button variant="ghost" onClick={() => setShowConfirmEnd(false)}>
                Continue defense
              </Button>
              <Button variant="danger" glow onClick={handleConfirmEnd}>
                End &amp; View Pitch Debrief
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Analyzing Progress Overlay */}
      {isEnding && (
        <div className="session-ending-overlay animate-fade-in">
          <div className="session-ending-card animate-scale-in">
            <div className="session-ending-spinner" />
            <h2>Analyzing your pitch defense…</h2>
            <p className="session-ending-phase">{analysisPhase}</p>
          </div>
        </div>
      )}

      {/* Left: Central AI Avatar Conversation Area */}
      <div className="session-page__avatar-col">
        <div className="session-page__meta">
          <div className="session-page__persona-meta">
            <span className="session-page__persona-name">{persona?.name ?? 'Investor'}</span>
            <span className="session-page__difficulty-tag">
              {(currentSetup?.difficulty || 'moderate').toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TurnDebugBadge />
            <span className="session-page__timer">{formattedTime}</span>
          </div>
        </div>

        {/* Simulation Transparency Banner */}
        <div className="session-simulation-banner">
          <TrustBadge type="simulated-investor" size="sm" />
          <span className="session-simulation-text">
            This investor is simulated for practice. Reactions do not represent actual funding interest or intent.
          </span>
          <button
            type="button"
            className="session-rai-link"
            onClick={() => setShowRaiModal(true)}
            title="Learn how VentureCue AI works responsibly"
          >
            Safety &amp; Privacy
          </button>
        </div>

        {/* Dynamic Objective Banner */}
        <div className="session-objective-banner">
          <TrendingUp size={14} />
          <span>
            <strong>Investor Objective:</strong> Defend your unit economics and defensibility. Back every claim with concrete data.
          </span>
        </div>

        {/* Realistic 3D Human Avatar Stage */}
        <div className="session-page__stage">
          <AvatarStage
            state={avatarState}
            personaId={persona?.id}
            personaName={persona?.name}
            currentSubtitle={latestAvatarLine}
          />
        </div>

        {/* Mic & Text Input Controls */}
        <div className="session-page__controls">
          <MicControl
            onSendMessage={sendMessage}
            micStatus={micStatus}
            errorMessage={errorMessage}
          />
        </div>

        {/* End Session Button */}
        <div className="session-page__end">
          <Button
            variant="danger"
            size="md"
            leftIcon={<Square size={14} />}
            onClick={() => setShowConfirmEnd(true)}
            disabled={isEnding}
          >
            End conversation
          </Button>
        </div>
      </div>

      {/* Right: Live Transcript */}
      <div className="session-page__transcript-col">
        <div className="session-page__transcript-header">
          <span>Live Conversation Transcript</span>
          <span className="session-page__transcript-live">Live</span>
        </div>
        <div className="session-page__transcript-body">
          <TranscriptPanel
            lines={activeSession?.transcript ?? []}
            personaName={persona?.name}
          />
        </div>
      </div>

      {/* Responsible AI Information Modal */}
      <ResponsibleAIModal
        isOpen={showRaiModal}
        onClose={() => setShowRaiModal(false)}
      />
    </div>
  );
};
