import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  History,
  MessageSquare,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useReviewStore } from '../../store/reviewStore';
import { useSessionStore } from '../../store/sessionStore';
import type { EditedField, EvidenceStatus } from '../../types/review';
import type { SessionDebrief } from '../../types/session';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import './ReviewDetailPage.css';

export const ReviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { reviews, acceptReview, editReview, rejectReview, updateEvidenceStatus } = useReviewStore();
  const { getSessionById } = useSessionStore();

  const review = reviews.find((r) => r.id === id);
  const session = review ? getSessionById(review.sessionId) : undefined;

  // Reviewer identity
  const [reviewerName, setReviewerName] = useState(review?.reviewerName || 'Marcus Vance (Venture Coach)');
  const [reviewerNotes, setReviewerNotes] = useState(review?.reviewerNotes || '');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(review?.rejectionReason || '');
  const [rejectionError, setRejectionError] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  // Form State for Editable Fields (deep copy of finalEvaluation or originalEvaluation)
  const [editableDebrief, setEditableDebrief] = useState<SessionDebrief>(() => {
    if (review?.finalEvaluation) {
      return JSON.parse(JSON.stringify(review.finalEvaluation));
    }
    if (review?.originalEvaluation) {
      return JSON.parse(JSON.stringify(review.originalEvaluation));
    }
    return {} as SessionDebrief;
  });

  const [evidenceItems, setEvidenceItems] = useState(review?.evidenceItems || []);
  const [disputeInputId, setDisputeInputId] = useState<string | null>(null);
  const [disputeText, setDisputeText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  if (!review) {
    return (
      <div className="review-not-found">
        <h2>Review Record Not Found</h2>
        <p>The requested human review record does not exist or has expired.</p>
        <Button variant="secondary" onClick={() => navigate('/reviews')}>
          Back to Review Queue
        </Button>
      </div>
    );
  }

  const origScore = review.originalEvaluation.score;
  const currentScore = editableDebrief.score || origScore;

  // Handle Score Input Change
  const handleScoreChange = (key: keyof typeof origScore, value: number) => {
    const clamped = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
    setEditableDebrief((prev) => ({
      ...prev,
      score: {
        ...prev.score,
        [key]: clamped,
      },
    }));
  };

  // Handle Evidence Item Verification / Dispute
  const handleSetEvidenceStatus = (evId: string, status: EvidenceStatus, note?: string) => {
    setEvidenceItems((prev) =>
      prev.map((ev) => (ev.id === evId ? { ...ev, status, disputeNote: note || ev.disputeNote } : ev))
    );
    updateEvidenceStatus({
      reviewId: review.id,
      evidenceId: evId,
      status,
      disputeNote: note,
    });
    setDisputeInputId(null);
    setDisputeText('');
  };

  // 1. Accept Workflow
  const handleAccept = () => {
    acceptReview({
      reviewId: review.id,
      reviewerId: 'usr-coach-01',
      reviewerName,
      notes: reviewerNotes || 'Verified AI diagnosis against transcript. No discrepancies detected.',
    });
    setFeedbackSuccess('AI Evaluation accepted and verified in the audit chain.');
    setTimeout(() => setFeedbackSuccess(null), 4000);
  };

  // 2. Edit & Save Workflow
  const handleSaveEdit = () => {
    // Detect edited fields by comparing originalEvaluation to editableDebrief
    const detectedEdits: EditedField[] = [];

    // Check overall score
    if (origScore.overall !== currentScore.overall) {
      detectedEdits.push({
        field: 'score.overall',
        label: 'Overall Readiness Score',
        originalValue: origScore.overall,
        newValue: currentScore.overall,
        reason: reviewerNotes || 'Score adjusted by human reviewer.',
      });
    }

    // Check specific sub-scores
    const scoreKeys = Object.keys(origScore) as Array<keyof typeof origScore>;
    scoreKeys.forEach((k) => {
      if (k !== 'overall' && origScore[k] !== currentScore[k]) {
        detectedEdits.push({
          field: `score.${k}`,
          label: `${String(k)}`,
          originalValue: origScore[k],
          newValue: currentScore[k],
        });
      }
    });

    // Check summary
    if (review.originalEvaluation.summary !== editableDebrief.summary) {
      detectedEdits.push({
        field: 'summary',
        label: 'Executive Summary',
        originalValue: review.originalEvaluation.summary,
        newValue: editableDebrief.summary,
      });
    }

    if (detectedEdits.length === 0 && !reviewerNotes.trim()) {
      alert('No modifications detected. To save without modifications, click "Accept AI Evaluation".');
      return;
    }

    editReview({
      reviewId: review.id,
      reviewerId: 'usr-coach-01',
      reviewerName,
      updatedEvaluation: editableDebrief,
      editedFields: detectedEdits,
      notes: reviewerNotes || 'Human reviewer modified diagnosis scores and findings.',
      evidenceItems,
    });

    setFeedbackSuccess('Human edits saved. Final evaluated diagnosis updated in audit chain.');
    setTimeout(() => setFeedbackSuccess(null), 4000);
  };

  // 3. Reject Workflow
  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required to reject an AI diagnosis.');
      return;
    }

    rejectReview({
      reviewId: review.id,
      reviewerId: 'usr-coach-01',
      reviewerName,
      rejectionReason,
      notes: reviewerNotes,
    });

    setShowRejectModal(false);
    setFeedbackSuccess('AI Evaluation marked as REJECTED. Preserved in audit trail.');
    setTimeout(() => setFeedbackSuccess(null), 4000);
  };

  return (
    <div className="review-detail-page">
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="review-modal-backdrop animate-fade-in">
          <div className="review-modal-card animate-scale-in">
            <div className="review-modal-icon review-modal-icon--danger">
              <AlertTriangle size={24} />
            </div>
            <h2>Reject AI Diagnosis?</h2>
            <p>
              Rejecting indicates the AI evaluation cannot be trusted as generated. The original diagnosis will be preserved for audit and oversight.
            </p>

            <div className="review-modal-field">
              <label htmlFor="rejection-reason">Reason for Rejection (Required):</label>
              <textarea
                id="rejection-reason"
                rows={3}
                placeholder="Explain why this evaluation is invalid (e.g. AI misclassified transcript metrics)..."
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectionError('');
                }}
              />
              {rejectionError && <span className="review-modal-error">{rejectionError}</span>}
            </div>

            <div className="review-modal-actions">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" glow onClick={handleRejectConfirm}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Status Bar */}
      <div className="review-detail__nav">
        <Link to="/reviews" className="review-back-link">
          <ArrowLeft size={16} />
          <span>Back to Review Queue</span>
        </Link>

        {feedbackSuccess && (
          <div className="review-toast-success animate-fade-in">
            <CheckCircle2 size={16} />
            <span>{feedbackSuccess}</span>
          </div>
        )}
      </div>

      {/* Header Banner */}
      <div className="review-detail__header">
        <div className="review-detail__header-left">
          <div className="review-header-tags">
            <Badge variant={review.sessionType === 'discovery' ? 'discovery' : 'pitch'}>
              {review.sessionType === 'discovery' ? 'Customer Discovery' : 'Investor Pitch'}
            </Badge>
            <span className="review-header-diff">{review.difficulty.toUpperCase()}</span>
            <span className={`review-status-pill review-status-pill--${review.reviewStatus.toLowerCase()}`}>
              {review.reviewStatus === 'PENDING' && <Clock size={14} className="pulse-icon" />}
              {review.reviewStatus === 'ACCEPTED' && <CheckCircle2 size={14} />}
              {review.reviewStatus === 'EDITED' && <Edit3 size={14} />}
              {review.reviewStatus === 'REJECTED' && <XCircle size={14} />}
              <span>{review.reviewStatus}</span>
            </span>
          </div>

          <h1>{review.startupName} — Diagnostic Review</h1>
          <p className="review-header-sub">
            Session with <strong>{review.personaName}</strong> • Session ID:{' '}
            <code>{review.sessionId}</code>
          </p>
        </div>

        {/* Review Action Controls */}
        <div className="review-detail__header-actions">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<CheckCircle2 size={16} />}
            onClick={handleAccept}
          >
            Accept As-Is
          </Button>

          <Button
            variant="primary"
            size="md"
            glow
            leftIcon={<Edit3 size={16} />}
            onClick={handleSaveEdit}
          >
            Save Human Edits
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="btn-reject-trigger"
            leftIcon={<XCircle size={16} />}
            onClick={() => setShowRejectModal(true)}
          >
            Reject Diagnosis
          </Button>
        </div>
      </div>

      {/* Reviewer Identity Bar */}
      <div className="reviewer-meta-bar">
        <div className="reviewer-meta-field">
          <label>Reviewer Name / Role:</label>
          <input
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="e.g. Marcus Vance (Senior Venture Coach)"
          />
        </div>
        <div className="reviewer-meta-ai-badge">
          <Sparkles size={14} />
          <span>AI Engine: {review.aiVersion} (Immutable Snapshot)</span>
        </div>
      </div>

      {/* Main Review Workspace Grid */}
      <div className="review-workspace-grid">
        {/* ============================================================
            LEFT: ORIGINAL AI DIAGNOSIS (IMMUTABLE SNAPSHOT)
            ============================================================ */}
        <div className="review-pane review-pane--original">
          <div className="review-pane__header">
            <div className="review-pane__title">
              <ShieldCheck size={18} className="icon-ai" />
              <h2>Original AI Evaluation</h2>
            </div>
            <span className="immutable-badge">🔒 Immutable Snapshot</span>
          </div>

          <div className="review-pane__content">
            {/* Score Card */}
            <div className="score-summary-card">
              <span className="score-label">Original AI Score</span>
              <div className="score-display">
                <span className="score-number">{origScore.overall}</span>
                <span className="score-max">/ 100</span>
              </div>
            </div>

            {/* Subscores */}
            <div className="subscores-list">
              {review.sessionType === 'discovery' ? (
                <>
                  <div className="subscore-row">
                    <span>Discovery Quality</span>
                    <strong>{origScore.discoveryQuality ?? '—'}</strong>
                  </div>
                  <div className="subscore-row">
                    <span>Question Quality</span>
                    <strong>{origScore.questionQuality ?? '—'}</strong>
                  </div>
                  <div className="subscore-row">
                    <span>Listening &amp; Empathy</span>
                    <strong>{origScore.listeningQuality ?? '—'}</strong>
                  </div>
                  <div className="subscore-row">
                    <span>Evidence Gathering</span>
                    <strong>{origScore.evidenceGathering ?? '—'}</strong>
                  </div>
                  <div className="subscore-row">
                    <span>Goal Coverage</span>
                    <strong>{origScore.goalCoverage ?? '—'}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="subscore-row">
                    <span>Pitch Clarity</span>
                    <strong>{origScore.pitchClarity ?? '—'}</strong>
                  </div>
                  <div className="subscore-row">
                    <span>Answer Quality</span>
                    <strong>{origScore.answerQuality ?? '—'}</strong>
                  </div>
                  <div className="subscore-row">
                    <span>Business Understanding</span>
                    <strong>{origScore.businessUnderstanding ?? '—'}</strong>
                  </div>
                  <div className="subscore-row">
                    <span>Market Reasoning</span>
                    <strong>{origScore.marketUnderstanding ?? '—'}</strong>
                  </div>
                  <div className="subscore-row">
                    <span>Objection Handling</span>
                    <strong>{origScore.objectionHandling ?? '—'}</strong>
                  </div>
                </>
              )}
            </div>

            {/* AI Executive Summary */}
            <div className="ai-summary-box">
              <label>AI Executive Summary:</label>
              <p>"{review.originalEvaluation.summary}"</p>
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT: HUMAN REVIEWED EVALUATION (INTERACTIVE / EDITABLE)
            ============================================================ */}
        <div className="review-pane review-pane--reviewed">
          <div className="review-pane__header">
            <div className="review-pane__title">
              <Edit3 size={18} className="icon-human" />
              <h2>Human-Reviewed Evaluation</h2>
            </div>
            <span className="editable-badge">Active Final Evaluation</span>
          </div>

          <div className="review-pane__content">
            {/* Score Card with Stepper */}
            <div className="score-summary-card score-summary-card--editable">
              <span className="score-label">Reviewed Overall Score</span>
              <div className="score-input-wrapper">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={currentScore.overall}
                  onChange={(e) => handleScoreChange('overall', parseInt(e.target.value, 10))}
                />
                <span className="score-max">/ 100</span>

                {currentScore.overall !== origScore.overall && (
                  <span
                    className={`score-diff-badge ${
                      currentScore.overall > origScore.overall
                        ? 'score-diff-badge--plus'
                        : 'score-diff-badge--minus'
                    }`}
                  >
                    {currentScore.overall > origScore.overall
                      ? `+${currentScore.overall - origScore.overall}`
                      : `${currentScore.overall - origScore.overall}`}
                  </span>
                )}
              </div>
            </div>

            {/* Editable Subscores */}
            <div className="subscores-list subscores-list--editable">
              {review.sessionType === 'discovery' ? (
                <>
                  <div className="subscore-edit-row">
                    <label htmlFor="edit-discovery-quality">Discovery Quality</label>
                    <input
                      id="edit-discovery-quality"
                      type="number"
                      min={0}
                      max={100}
                      value={currentScore.discoveryQuality ?? 0}
                      onChange={(e) => handleScoreChange('discoveryQuality', parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="subscore-edit-row">
                    <label htmlFor="edit-question-quality">Question Quality</label>
                    <input
                      id="edit-question-quality"
                      type="number"
                      min={0}
                      max={100}
                      value={currentScore.questionQuality ?? 0}
                      onChange={(e) => handleScoreChange('questionQuality', parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="subscore-edit-row">
                    <label htmlFor="edit-listening-quality">Listening &amp; Empathy</label>
                    <input
                      id="edit-listening-quality"
                      type="number"
                      min={0}
                      max={100}
                      value={currentScore.listeningQuality ?? 0}
                      onChange={(e) => handleScoreChange('listeningQuality', parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="subscore-edit-row">
                    <label htmlFor="edit-evidence-gathering">Evidence Gathering</label>
                    <input
                      id="edit-evidence-gathering"
                      type="number"
                      min={0}
                      max={100}
                      value={currentScore.evidenceGathering ?? 0}
                      onChange={(e) => handleScoreChange('evidenceGathering', parseInt(e.target.value, 10))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="subscore-edit-row">
                    <label htmlFor="edit-pitch-clarity">Pitch Clarity</label>
                    <input
                      id="edit-pitch-clarity"
                      type="number"
                      min={0}
                      max={100}
                      value={currentScore.pitchClarity ?? 0}
                      onChange={(e) => handleScoreChange('pitchClarity', parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="subscore-edit-row">
                    <label htmlFor="edit-answer-quality">Answer Quality</label>
                    <input
                      id="edit-answer-quality"
                      type="number"
                      min={0}
                      max={100}
                      value={currentScore.answerQuality ?? 0}
                      onChange={(e) => handleScoreChange('answerQuality', parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="subscore-edit-row">
                    <label htmlFor="edit-business-understanding">Business Understanding</label>
                    <input
                      id="edit-business-understanding"
                      type="number"
                      min={0}
                      max={100}
                      value={currentScore.businessUnderstanding ?? 0}
                      onChange={(e) => handleScoreChange('businessUnderstanding', parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="subscore-edit-row">
                    <label htmlFor="edit-objection-handling">Objection Handling</label>
                    <input
                      id="edit-objection-handling"
                      type="number"
                      min={0}
                      max={100}
                      value={currentScore.objectionHandling ?? 0}
                      onChange={(e) => handleScoreChange('objectionHandling', parseInt(e.target.value, 10))}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Editable Executive Summary */}
            <div className="human-summary-editor">
              <label htmlFor="review-summary">Executive Debrief Summary (Editable):</label>
              <textarea
                id="review-summary"
                rows={3}
                value={editableDebrief.summary || ''}
                onChange={(e) => setEditableDebrief((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder="Modify executive diagnosis summary for founder coaching..."
              />
            </div>

            {/* Reviewer Notes & Rationale */}
            <div className="human-notes-editor">
              <label htmlFor="reviewer-notes">Reviewer Rationale &amp; Coaching Notes:</label>
              <textarea
                id="reviewer-notes"
                rows={3}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Explain the reasons for score adjustments or highlight key coaching takeaways..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          EVIDENCE VERIFICATION & DISPUTE PANEL
          ============================================================ */}
      <div className="evidence-panel-card">
        <div className="evidence-panel-header">
          <div className="evidence-header-left">
            <FileText size={20} className="icon-evidence" />
            <div>
              <h3>Transcript Evidence Verification</h3>
              <p>Verify or dispute the underlying conversational evidence for key AI findings.</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<MessageSquare size={14} />}
            rightIcon={showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            onClick={() => setShowTranscript(!showTranscript)}
          >
            {showTranscript ? 'Hide Full Transcript' : 'Show Full Transcript'}
          </Button>
        </div>

        {/* Collapsible Full Transcript Drawer */}
        {showTranscript && session && (
          <div className="review-transcript-drawer animate-fade-in">
            <h4>Full Conversation Transcript ({session.transcript.length} turns)</h4>
            <div className="review-transcript-scroll">
              {session.transcript.map((line, idx) => (
                <div key={line.id || idx} className={`review-transcript-line line--${line.speaker}`}>
                  <span className="transcript-speaker">
                    {line.speaker === 'user' ? 'Founder' : review.personaName}:
                  </span>
                  <p className="transcript-text">{line.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Items List */}
        <div className="evidence-items-list">
          {evidenceItems.length === 0 ? (
            <p className="evidence-empty">No specific transcript evidence items were flagged for this session.</p>
          ) : (
            evidenceItems.map((ev) => (
              <div key={ev.id} className={`evidence-item evidence-item--${ev.status}`}>
                <div className="evidence-item-main">
                  <div className="evidence-item-type">
                    <span className="evidence-type-badge">{ev.findingType.replace('_', ' ').toUpperCase()}</span>
                    <strong>{ev.findingText}</strong>
                  </div>

                  {ev.quote && (
                    <blockquote className="evidence-quote">
                      "{ev.quote}"
                    </blockquote>
                  )}

                  {ev.disputeNote && (
                    <div className="evidence-dispute-note">
                      <AlertTriangle size={14} />
                      <span>
                        <strong>Dispute Note:</strong> {ev.disputeNote}
                      </span>
                    </div>
                  )}
                </div>

                <div className="evidence-item-actions">
                  <span className={`evidence-status-pill evidence-status-pill--${ev.status}`}>
                    {ev.status === 'verified' && '✓ Verified'}
                    {ev.status === 'disputed' && '⚠️ Disputed'}
                    {ev.status === 'modified' && '✎ Modified'}
                  </span>

                  <div className="evidence-btn-group">
                    <button
                      type="button"
                      className="btn-ev-verify"
                      onClick={() => handleSetEvidenceStatus(ev.id, 'verified')}
                      title="Verify this quote accurately represents the founder behavior"
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      className="btn-ev-dispute"
                      onClick={() => {
                        setDisputeInputId(ev.id);
                        setDisputeText(ev.disputeNote || '');
                      }}
                      title="Dispute this AI interpretation"
                    >
                      Dispute
                    </button>
                  </div>
                </div>

                {disputeInputId === ev.id && (
                  <div className="evidence-dispute-input-box animate-fade-in">
                    <input
                      type="text"
                      placeholder="Enter reason for disputing this evidence..."
                      value={disputeText}
                      onChange={(e) => setDisputeText(e.target.value)}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSetEvidenceStatus(ev.id, 'disputed', disputeText)}
                    >
                      Save Dispute
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDisputeInputId(null)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================================
          IMMUTABLE AUDIT TRAIL LOG
          ============================================================ */}
      <div className="audit-trail-card">
        <div className="audit-trail-header">
          <History size={18} className="icon-audit" />
          <h3>Immutable Audit Trail ({review.auditTrail.length} entries)</h3>
        </div>

        <div className="audit-timeline">
          {review.auditTrail.map((entry, idx) => (
            <div key={entry.id || idx} className={`audit-entry audit-entry--${entry.action.toLowerCase()}`}>
              <div className="audit-entry-dot" />
              <div className="audit-entry-body">
                <div className="audit-entry-top">
                  <span className={`audit-action-badge audit-action-badge--${entry.action.toLowerCase()}`}>
                    {entry.action}
                  </span>
                  <span className="audit-actor">{entry.reviewerName}</span>
                  <span className="audit-time">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>

                {entry.reason && <p className="audit-reason">"{entry.reason}"</p>}

                {entry.changedFields && entry.changedFields.length > 0 && (
                  <div className="audit-changed-fields">
                    <span>Field Modifications:</span>
                    <ul>
                      {entry.changedFields.map((cf, cidx) => (
                        <li key={cidx}>
                          <code>{cf.field}</code>: changed from <strong>{String(cf.originalValue)}</strong> to{' '}
                          <strong>{String(cf.newValue)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
