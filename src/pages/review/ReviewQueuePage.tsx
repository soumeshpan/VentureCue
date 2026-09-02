import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Edit3,
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { useReviewStore } from '../../store/reviewStore';
import type { ReviewStatus, ReviewFilterOptions } from '../../types/review';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/shared/States';
import './ReviewQueuePage.css';

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const ReviewQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { reviews } = useReviewStore();

  const [statusFilter, setStatusFilter] = useState<'ALL' | ReviewStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'discovery' | 'pitch'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score_asc' | 'score_desc'>('newest');

  // Filter & Sort
  const filtered = reviews.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.reviewStatus === statusFilter;
    const matchesType = typeFilter === 'ALL' || r.sessionType === typeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      r.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.personaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sessionId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return b.createdAt - a.createdAt;
    if (sortBy === 'oldest') return a.createdAt - b.createdAt;
    const scoreA = a.finalEvaluation?.score?.overall ?? a.originalEvaluation?.score?.overall ?? 0;
    const scoreB = b.finalEvaluation?.score?.overall ?? b.originalEvaluation?.score?.overall ?? 0;
    if (sortBy === 'score_asc') return scoreA - scoreB;
    if (sortBy === 'score_desc') return scoreB - scoreA;
    return 0;
  });

  const pendingCount = reviews.filter((r) => r.reviewStatus === 'PENDING').length;
  const acceptedCount = reviews.filter((r) => r.reviewStatus === 'ACCEPTED').length;
  const editedCount = reviews.filter((r) => r.reviewStatus === 'EDITED').length;
  const rejectedCount = reviews.filter((r) => r.reviewStatus === 'REJECTED').length;

  return (
    <div className="review-queue-page">
      {/* Header */}
      <div className="review-queue__header">
        <div>
          <div className="review-queue__eyebrow">DIAGNOSTIC VERIFICATION LAYER</div>
          <h1>Human Review &amp; Audit Queue</h1>
          <p>
            Verify, edit, or reject AI-generated diagnoses against conversational transcript evidence.
            Original AI outputs are permanently preserved in the immutable audit chain.
          </p>
        </div>
      </div>

      {/* Review Metrics Overview */}
      <div className="review-queue__stats-grid">
        <div
          className={`review-stat-card ${statusFilter === 'PENDING' ? 'review-stat-card--active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          role="button"
          tabIndex={0}
        >
          <div className="review-stat-card__icon review-stat-card__icon--pending">
            <Clock size={20} />
          </div>
          <div>
            <span className="review-stat-card__val">{pendingCount}</span>
            <span className="review-stat-card__lbl">Awaiting Review</span>
          </div>
        </div>

        <div
          className={`review-stat-card ${statusFilter === 'ACCEPTED' ? 'review-stat-card--active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'ACCEPTED' ? 'ALL' : 'ACCEPTED')}
          role="button"
          tabIndex={0}
        >
          <div className="review-stat-card__icon review-stat-card__icon--accepted">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="review-stat-card__val">{acceptedCount}</span>
            <span className="review-stat-card__lbl">Accepted As-Is</span>
          </div>
        </div>

        <div
          className={`review-stat-card ${statusFilter === 'EDITED' ? 'review-stat-card--active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'EDITED' ? 'ALL' : 'EDITED')}
          role="button"
          tabIndex={0}
        >
          <div className="review-stat-card__icon review-stat-card__icon--edited">
            <Edit3 size={20} />
          </div>
          <div>
            <span className="review-stat-card__val">{editedCount}</span>
            <span className="review-stat-card__lbl">Human Edited</span>
          </div>
        </div>

        <div
          className={`review-stat-card ${statusFilter === 'REJECTED' ? 'review-stat-card--active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'REJECTED' ? 'ALL' : 'REJECTED')}
          role="button"
          tabIndex={0}
        >
          <div className="review-stat-card__icon review-stat-card__icon--rejected">
            <XCircle size={20} />
          </div>
          <div>
            <span className="review-stat-card__val">{rejectedCount}</span>
            <span className="review-stat-card__lbl">Rejected</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="review-queue__controls">
        {/* Search */}
        <div className="review-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by startup name, persona, or session ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filters */}
        <div className="review-filter-group" role="group" aria-label="Status filter">
          {(['ALL', 'PENDING', 'ACCEPTED', 'EDITED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              className={`review-filter-btn ${statusFilter === st ? 'review-filter-btn--active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>

        {/* Type Filters */}
        <div className="review-filter-group" role="group" aria-label="Session type filter">
          {(['ALL', 'discovery', 'pitch'] as const).map((tp) => (
            <button
              key={tp}
              type="button"
              className={`review-filter-btn ${typeFilter === tp ? 'review-filter-btn--active' : ''}`}
              onClick={() => setTypeFilter(tp)}
            >
              {tp === 'ALL' ? 'All Modules' : tp === 'discovery' ? 'Discovery' : 'Pitch'}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="review-sort-box">
          <ArrowUpDown size={14} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="score_desc">Highest score</option>
            <option value="score_asc">Lowest score</option>
          </select>
        </div>
      </div>

      {/* Reviews Queue List */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={32} />}
          title="No evaluations found"
          description="Try clearing your filters or complete a new practice session to populate the review queue."
          action={{
            label: 'Start Practice Session',
            onClick: () => navigate('/discovery/new'),
          }}
        />
      ) : (
        <div className="review-table-container">
          <table className="review-table">
            <thead>
              <tr>
                <th>Session &amp; Startup</th>
                <th>Type</th>
                <th>Persona &amp; Diff</th>
                <th>AI Score</th>
                <th>Reviewed Score</th>
                <th>Status</th>
                <th>Audit / Reviewer</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((rev) => {
                const origScore = rev.originalEvaluation?.score?.overall ?? 0;
                const finalScore = rev.finalEvaluation?.score?.overall ?? origScore;
                const isScoreChanged = rev.reviewStatus === 'EDITED' && origScore !== finalScore;

                return (
                  <tr
                    key={rev.id}
                    className={`review-row review-row--${rev.reviewStatus.toLowerCase()}`}
                    onClick={() => navigate(`/reviews/${rev.id}`)}
                  >
                    <td>
                      <div className="review-cell-startup">
                        <strong>{rev.startupName}</strong>
                        <span className="review-cell-id">{rev.sessionId}</span>
                      </div>
                    </td>

                    <td>
                      <Badge variant={rev.sessionType === 'discovery' ? 'discovery' : 'pitch'} size="sm">
                        {rev.sessionType === 'discovery' ? 'Discovery' : 'Pitch'}
                      </Badge>
                    </td>

                    <td>
                      <div className="review-cell-persona">
                        <span>{rev.personaName}</span>
                        <span className="review-diff-tag">{rev.difficulty.toUpperCase()}</span>
                      </div>
                    </td>

                    <td>
                      <span className="review-score-orig">{origScore}</span>
                    </td>

                    <td>
                      {rev.reviewStatus === 'EDITED' ? (
                        <div className="review-score-edited">
                          <strong>{finalScore}</strong>
                          {isScoreChanged && (
                            <span
                              className={`score-delta ${
                                finalScore > origScore ? 'score-delta--up' : 'score-delta--down'
                              }`}
                            >
                              {finalScore > origScore ? `+${finalScore - origScore}` : `${finalScore - origScore}`}
                            </span>
                          )}
                        </div>
                      ) : rev.reviewStatus === 'ACCEPTED' ? (
                        <span className="review-score-verified">{origScore} (Verified)</span>
                      ) : rev.reviewStatus === 'REJECTED' ? (
                        <span className="review-score-rejected">— (Rejected)</span>
                      ) : (
                        <span className="review-score-pending">Pending</span>
                      )}
                    </td>

                    <td>
                      <span className={`review-status-badge review-status-badge--${rev.reviewStatus.toLowerCase()}`}>
                        {rev.reviewStatus === 'PENDING' && <Clock size={12} className="pulse-icon" />}
                        {rev.reviewStatus === 'ACCEPTED' && <CheckCircle2 size={12} />}
                        {rev.reviewStatus === 'EDITED' && <Edit3 size={12} />}
                        {rev.reviewStatus === 'REJECTED' && <XCircle size={12} />}
                        <span>{rev.reviewStatus}</span>
                      </span>
                    </td>

                    <td>
                      <div className="review-cell-audit">
                        {rev.reviewerName ? (
                          <>
                            <span className="reviewer-name">{rev.reviewerName.split(' ')[0]}</span>
                            <span className="reviewed-date">{formatDate(rev.reviewedAt || rev.createdAt)}</span>
                          </>
                        ) : (
                          <>
                            <span className="reviewer-unassigned">Unassigned</span>
                            <span className="reviewed-date">{formatDate(rev.createdAt)}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td>
                      <Button
                        variant={rev.reviewStatus === 'PENDING' ? 'primary' : 'secondary'}
                        size="sm"
                        glow={rev.reviewStatus === 'PENDING'}
                        rightIcon={<ChevronRight size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/reviews/${rev.id}`);
                        }}
                      >
                        {rev.reviewStatus === 'PENDING' ? 'Verify & Review' : 'View Audit'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
