import React, { useState, useEffect } from 'react';
import {
  Wifi,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Check,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import {
  getAllPendingSubmissions,
  getAllPendingAttempts,
  getAllPendingDoubts,
  markQuizSubmissionsAsSynced,
  markQuizAttemptsAsSynced,
  markDoubtsAsSynced,
  getPendingSyncCount
} from '../utils/indexedDB.js';

export const MicroSyncModal = ({ isOpen, onClose, onSyncComplete, lectures = [] }) => {
  const [syncState, setSyncState] = useState('review'); // 'review', 'syncing', 'success', 'error'
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [pendingAttempts, setPendingAttempts] = useState([]);
  const [pendingDoubts, setPendingDoubts] = useState([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncedCounts, setSyncedCounts] = useState({ quizzes: 0, doubts: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [lastSyncedTime, setLastSyncedTime] = useState('Just now');

  // Helper to resolve lecture title from lectures array
  const getLectureInfo = (lectureId) => {
    if (!lectureId) return { title: 'General Lecture', id: '' };
    const found = lectures.find((l) => l.lectureId === lectureId);
    if (found) {
      return {
        title: found.title || 'Untitled Lecture',
        id: found.lectureId,
        subject: found.subject || found.courseId || ''
      };
    }
    return {
      title: 'Course Lecture',
      id: lectureId,
      subject: ''
    };
  };

  // Load pending records whenever modal opens
  useEffect(() => {
    if (isOpen) {
      loadPendingData();
    }
  }, [isOpen]);

  const loadPendingData = async () => {
    try {
      setSyncState('review');
      setSyncProgress(0);
      setErrorMessage('');

      const [submissions, attempts, doubts] = await Promise.all([
        getAllPendingSubmissions(),
        getAllPendingAttempts(),
        getAllPendingDoubts()
      ]);

      setPendingQuizzes(submissions);
      setPendingAttempts(attempts);
      setPendingDoubts(doubts);
    } catch (err) {
      console.error('Failed to load pending offline records:', err);
    }
  };

  const handleStartSync = async () => {
    try {
      setSyncState('syncing');
      setSyncProgress(15);
      setErrorMessage('');

      // Prepare payload
      const quizzesPayload = pendingQuizzes.length > 0
        ? pendingQuizzes
        : pendingAttempts.map(att => ({
            quizId: att.quizId,
            lectureId: att.lectureId,
            versionId: att.versionId,
            score: att.score || 0,
            totalQuestions: 1,
            correctCount: att.score ? 1 : 0,
            wrongCount: att.score ? 0 : 1,
            answersMap: { [att.questionId]: att.selectedAnswer },
            createdAt: att.createdAt
          }));

      const doubtsPayload = pendingDoubts.map(d => ({
        doubtId: d.doubtId,
        lectureId: d.lectureId,
        timestamp: d.timestamp,
        text: d.text,
        createdAt: d.createdAt
      }));

      setSyncProgress(40);

      // Call backend API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/sync/microsync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizzes: quizzesPayload,
          doubts: doubtsPayload
        })
      });

      setSyncProgress(75);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Sync failed with server status ${response.status}`);
      }

      const result = await response.json();
      console.log('[MicroSync] Server sync success:', result);

      // Mark IndexedDB local records as 'synced' without deleting them
      if (pendingQuizzes.length > 0) {
        await markQuizSubmissionsAsSynced(
          pendingQuizzes.map(q => ({ quizId: q.quizId, lectureId: q.lectureId }))
        );
      }
      if (pendingAttempts.length > 0) {
        await markQuizAttemptsAsSynced(
          pendingAttempts.map(a => ({ quizId: a.quizId, questionId: a.questionId }))
        );
      }
      if (pendingDoubts.length > 0) {
        await markDoubtsAsSynced(pendingDoubts.map(d => d.doubtId));
      }

      setSyncProgress(100);
      setSyncedCounts({
        quizzes: result.syncedQuizzesCount || quizzesPayload.length,
        doubts: result.syncedDoubtsCount || doubtsPayload.length
      });
      setLastSyncedTime('Just now');
      setSyncState('success');

      // Refresh parent state
      const remainingPending = await getPendingSyncCount();
      if (onSyncComplete) {
        onSyncComplete(remainingPending);
      }
    } catch (err) {
      console.error('[MicroSync] Execution error:', err);
      setErrorMessage(err.message || 'Connection interrupted. Please try again.');
      setSyncState('error');
    }
  };

  if (!isOpen) return null;

  const totalPendingUnits = (pendingQuizzes.length || (pendingAttempts.length > 0 ? 1 : 0)) + pendingDoubts.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card microsync-large-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header microsync-header">
          <div className="microsync-header-left">
            <div className={`connection-beacon ${syncState === 'syncing' ? 'pulsing' : 'active'}`}>
              <Wifi size={20} />
            </div>
            <div>
              <div className="microsync-badge-tag">MicroSync • Student Learning</div>
              <h3 className="modal-title">Short connection detected</h3>
              <p className="modal-subtitle">
                {syncState === 'success'
                  ? 'All pending records synced'
                  : syncState === 'syncing'
                  ? 'Syncing your learning...'
                  : 'Opportunistic sync ready: upload your quizzes and doubts safely.'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body microsync-body">
          {/* Review / Pre-sync or Syncing State */}
          {(syncState === 'review' || syncState === 'syncing') && (
            <div className="sync-queue-container">
              <div className="sync-notice-banner">
                <ShieldCheck size={20} className="notice-icon" />
                <div>
                  <strong>Preserved Local Storage:</strong> All offline records are stored in your device's IndexedDB. When synced, they remain permanently preserved locally as <em>Synced</em> and will not be overwritten or lost.
                </div>
              </div>

              {/* Live progress indicator when syncing */}
              {syncState === 'syncing' && (
                <div className="sync-progress-box">
                  <div className="progress-label-row">
                    <span className="syncing-spinner-text">
                      <RefreshCw size={15} className="spin-icon" />
                      Syncing your learning...
                    </span>
                    <span className="progress-percent">{syncProgress}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Queue Items */}
              <div className="queue-section-header">
                <span className="queue-title">Items in Sync Queue ({totalPendingUnits})</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="queue-status-tag">Pending Sync: {totalPendingUnits}</span>
                  <span className="queue-storage-tag">Local Storage: Preserved</span>
                </div>
              </div>

              <div className="queue-items-list">
                {/* Quizzes in Queue */}
                {pendingQuizzes.length > 0 ? (
                  pendingQuizzes.map((q, idx) => {
                    const info = getLectureInfo(q.lectureId);
                    return (
                      <div key={`quiz-${idx}`} className="queue-item-card">
                        <div className="queue-item-icon quiz-type">
                          <Check size={18} />
                        </div>
                        <div className="queue-item-details">
                          <div className="queue-item-title">
                            <span>Quiz Being Synced</span>
                            <span className="item-badge-score">Score: {q.score}/{q.totalQuestions}</span>
                          </div>
                          <div className="queue-item-lecture-row">
                            <span className="item-lecture-title">{info.title}</span>
                            <span className="item-lecture-id">ID: {info.id}</span>
                          </div>
                        </div>
                        <span className="queue-state-pill">
                          {syncState === 'syncing' ? 'Syncing...' : 'Pending Sync'}
                        </span>
                      </div>
                    );
                  })
                ) : pendingAttempts.length > 0 ? (
                  (() => {
                    const info = getLectureInfo(pendingAttempts[0].lectureId);
                    return (
                      <div className="queue-item-card">
                        <div className="queue-item-icon quiz-type">
                          <Check size={18} />
                        </div>
                        <div className="queue-item-details">
                          <div className="queue-item-title">
                            <span>Quiz Being Synced ({pendingAttempts.length} answers)</span>
                          </div>
                          <div className="queue-item-lecture-row">
                            <span className="item-lecture-title">{info.title}</span>
                            <span className="item-lecture-id">ID: {info.id}</span>
                          </div>
                        </div>
                        <span className="queue-state-pill">
                          {syncState === 'syncing' ? 'Syncing...' : 'Pending Sync'}
                        </span>
                      </div>
                    );
                  })()
                ) : null}

                {/* Doubts in Queue */}
                {pendingDoubts.map((d, idx) => {
                  const info = getLectureInfo(d.lectureId);
                  return (
                    <div key={`doubt-${d.doubtId || idx}`} className="queue-item-card">
                      <div className="queue-item-icon doubt-type">
                        <HelpCircle size={18} />
                      </div>
                      <div className="queue-item-details">
                        <div className="queue-item-title">
                          <span>Doubt Being Synced</span>
                          <span className="item-badge-timestamp">at {d.timestamp}</span>
                        </div>
                        <div className="queue-item-lecture-row">
                          <span className="item-lecture-title">{info.title}</span>
                          <span className="item-lecture-id">ID: {info.id}</span>
                        </div>
                        <div className="queue-item-sub">
                          "{d.text.length > 80 ? d.text.substring(0, 80) + '...' : d.text}"
                        </div>
                      </div>
                      <span className="queue-state-pill">
                        {syncState === 'syncing' ? 'Syncing...' : 'Pending Sync'}
                      </span>
                    </div>
                  );
                })}

                {totalPendingUnits === 0 && (
                  <div className="empty-queue-message">
                    <CheckCircle2 size={36} color="#10b981" />
                    <p className="empty-queue-main">No offline learning data pending sync.</p>
                    <p className="empty-queue-sub">All your completed quizzes and asked doubts are preserved in local storage and synced with the cloud.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Screen */}
          {syncState === 'success' && (
            <div className="sync-success-screen">
              <div className="sync-success-icon-bubble">
                <CheckCircle2 size={44} />
              </div>
              <h3 className="sync-success-title">Everything synced successfully</h3>
              <p className="sync-success-body">
                Your offline learning records were safely transmitted to Vidya Setu cloud servers during this connection window.
              </p>

              <div className="sync-summary-card">
                <div className="summary-stat-row">
                  <span className="stat-label">Records Synced Count</span>
                  <span className="stat-value">
                    {syncedCounts.quizzes} quiz{syncedCounts.quizzes !== 1 ? 'zes' : ''}, {syncedCounts.doubts} doubt{syncedCounts.doubts !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="summary-stat-row">
                  <span className="stat-label">Pending Sync Count</span>
                  <span className="stat-value highlight-green">0 (All caught up)</span>
                </div>
                <div className="summary-stat-row">
                  <span className="stat-label">Local Storage</span>
                  <span className="stat-value highlight-green">Synced / Preserved in IndexedDB</span>
                </div>
                <div className="summary-stat-row">
                  <span className="stat-label">Sync Status</span>
                  <span className="stat-value timestamp-val">Complete ({lastSyncedTime})</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Screen */}
          {syncState === 'error' && (
            <div className="sync-error-box">
              <AlertCircle size={28} color="#ef4444" />
              <div className="error-text-content">
                <h4>Synchronization Interrupted</h4>
                <p>{errorMessage}</p>
                <p className="error-safe-note">Note: Your offline progress is 100% safe and preserved in local storage.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer microsync-footer">
          {syncState === 'review' && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sync-now"
                onClick={handleStartSync}
                disabled={totalPendingUnits === 0}
              >
                <RefreshCw size={15} />
                Sync Now ({totalPendingUnits})
              </button>
            </>
          )}

          {syncState === 'syncing' && (
            <button type="button" className="btn btn-primary" disabled>
              <RefreshCw size={15} className="spin-icon" />
              Syncing in progress...
            </button>
          )}

          {syncState === 'success' && (
            <button
              type="button"
              className="btn btn-primary btn-continue-learning"
              onClick={onClose}
            >
              Continue Learning
              <ArrowRight size={16} />
            </button>
          )}

          {syncState === 'error' && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartSync}
              >
                <RefreshCw size={15} />
                Retry Sync
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
