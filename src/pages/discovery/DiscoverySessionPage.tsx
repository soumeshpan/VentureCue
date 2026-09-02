import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Square, Target, AlertCircle } from 'lucide-react';
import { useDiscoveryStore } from '../../store/discoveryStore';
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
import './DiscoverySessionPage.css';

export const DiscoverySessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentSetup } = useDiscoveryStore();
  const { activeSession, avatarState, startSession, saveCompletedSession } = useSessionStore();
  const { formattedTime, start, elapsedSeconds } = useSession();
  const { status: micStatus, requestPermission, errorMessage } = useMicrophone();

  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showRaiModal, setShowRaiModal] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState('Extracting conversation dialogue…');
  const sessionInitialized = useRef(false);

  const persona = currentSetup?.personaId
    ? getPersonaById(currentSetup.personaId)
    : getPersonaById('skeptic');

  const sessionConfig: SessionConfig | null = {
    sessionId: id ?? `disc-${Date.now()}`,
    type: 'discovery',
    personaId: currentSetup?.personaId || 'skeptic',
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

    const newSessionId = id ?? `disc-${Date.now()}`;
    const selectedAssumptionStatements = (currentSetup?.assumptions || [])
      .filter((a) => a.selected)
      .map((a) => a.statement);

    startSession({
      id: newSessionId,
      type: 'discovery',
      personaId: persona?.id ?? 'skeptic',
      personaName: persona?.name ?? 'The Skeptic',
      difficulty: currentSetup?.difficulty ?? 'moderate',
      startedAt: Date.now(),
      startupName: currentSetup?.context?.startupName || 'Your Startup',
      selectedAssumptions: selectedAssumptionStatements,
      transcript: [],
      events: [],
    });

    start();
    requestPermission();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirmEnd = async () => {
    setShowConfirmEnd(false);
    setIsEnding(true);

    // Multi-phase diagnostic analysis
    setAnalysisPhase('Extracting conversation dialogue…');
    await new Promise((r) => setTimeout(r, 400));
    setAnalysisPhase('Evaluating question neutrality & detecting leading questions…');
    await new Promise((r) => setTimeout(r, 600));
    setAnalysisPhase('Measuring problem exploration depth & evidence gathering…');
    await new Promise((r) => setTimeout(r, 500));
    setAnalysisPhase('Synthesizing readiness report & actionable coaching…');
    await new Promise((r) => setTimeout(r, 400));

    const transcript = activeSession?.transcript || [];
    const sessionId = activeSession?.id || id || `disc-${Date.now()}`;

    const completedSession: Session = {
      id: sessionId,
      type: 'discovery',
      personaId: persona?.id || 'skeptic',
      personaName: persona?.name || 'The Skeptic',
      difficulty: currentSetup?.difficulty || 'moderate',
      startedAt: activeSession?.startedAt || Date.now() - elapsedSeconds * 1000,
      endedAt: Date.now(),
      durationSeconds: Math.max(elapsedSeconds, 15),
      transcript,
      startupName: currentSetup?.context?.startupName || 'Your Startup',
      selectedAssumptions:
        currentSetup?.assumptions?.filter((a) => a.selected).map((a) => a.statement) || [],
    };

    // Run live AI evaluation engine via NVIDIA NIM
    const debrief = await EvaluationService.evaluateDiscoverySessionAsync({
      session: completedSession,
      context: currentSetup?.context || {
        startupName: 'Your Startup',
        whatBuilding: 'A solution',
        targetCustomer: 'Target customers',
        problemHypothesis: 'Operational friction',
      },
      assumptions: currentSetup?.assumptions || [],
      persona: persona || {
        id: 'skeptic',
        category: 'customer',
        name: 'The Skeptic',
        tagline: '',
        description: '',
        behaviorCues: [],
        traits: [],
        difficulty: 'hard',
        icon: 'User',
      },
      difficulty: currentSetup?.difficulty || 'moderate',
    });

    completedSession.debrief = debrief;

    // Save session to history store
    saveCompletedSession(completedSession);

    // Create pending Human Review audit record
    useReviewStore.getState().createPendingReview({
      sessionId,
      sessionType: 'discovery',
      startupName: currentSetup?.context?.startupName || 'Your Startup',
      personaName: persona?.name || 'Customer',
      difficulty: currentSetup?.difficulty || 'moderate',
      evaluation: debrief,
    });

    navigate(`/discovery/debrief/${sessionId}`);
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
            <h2>End Practice Conversation?</h2>
            <p>
              Your simulated conversation with <strong>{persona?.name}</strong> will be analyzed
              for discovery quality, question neutrality, and evidence gathering.
            </p>
            <div className="session-modal-actions">
              <Button variant="ghost" onClick={() => setShowConfirmEnd(false)}>
                Continue practicing
              </Button>
              <Button variant="danger" glow onClick={handleConfirmEnd}>
                End &amp; Analyze Session
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
            <h2>Analyzing your conversation…</h2>
            <p className="session-ending-phase">{analysisPhase}</p>
          </div>
        </div>
      )}

      {/* Left: Central AI Avatar Conversation Area */}
      <div className="session-page__avatar-col">
        <div className="session-page__meta">
          <div className="session-page__persona-meta">
            <span className="session-page__persona-name">{persona?.name ?? 'Customer'}</span>
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
          <TrustBadge type="simulated-customer" size="sm" />
          <span className="session-simulation-text">
            This customer is simulated for practice. Responses are not evidence of actual market demand.
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
          <Target size={14} />
          <span>
            <strong>Objective:</strong> Uncover the customer's baseline workflow and past friction. Avoid pitching features.
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
