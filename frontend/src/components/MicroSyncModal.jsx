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

export const MicroSyncModal = ({ isOpen, onClose, onSyncComplete }) => {
  const [syncState, setSyncState] = useState('review'); // 'review', 'syncing', 'success', 'error'
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [pendingAttempts, setPendingAttempts] = useState([]);
  const [pendingDoubts, setPendingDoubts] = useState([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncedCounts, setSyncedCounts] = useState({ quizzes: 0, doubts: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const [lastSyncedTime, setLastSyncedTime] = useState('Just now');

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
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container microsync-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header microsync-header">
          <div className="microsync-header-left">
            <div className={`connection-beacon ${syncState === 'syncing' ? 'pulsing' : 'active'}`}>
              <Wifi size={18} />
            </div>
            <div>
              <h3 className="modal-title">Short connection detected</h3>
              <p className="modal-subtitle">
                {syncState === 'success'
                  ? 'All pending records synced'
                  : 'Syncing your learning...'}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body microsync-body">
          {/* Review / Pre-sync or Syncing State */}
          {(syncState === 'review' || syncState === 'syncing') && (
            <div className="sync-queue-container">
              <div className="sync-notice-banner">
                <ShieldCheck size={18} className="notice-icon" />
                <span>
                  <strong>Short connection available:</strong> Local offline records will be safely synchronized to the Vidya Setu server and marked as <em>synced</em> without deletion.
                </span>
              </div>

              {/* Live progress indicator when syncing */}
              {syncState === 'syncing' && (
                <div className="sync-progress-box">
                  <div className="progress-label-row">
                    <span className="syncing-spinner-text">
                      <RefreshCw size={14} className="spin-icon" />
                      Uploading learning queue...
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
                <span className="queue-status-tag">Pending Sync</span>
              </div>

              <div className="queue-items-list">
                {/* Quizzes in Queue */}
                {pendingQuizzes.length > 0 ? (
                  pendingQuizzes.map((q, idx) => (
                    <div key={`quiz-${idx}`} className="queue-item-card">
                      <div className="queue-item-icon quiz-type">
                        <Check size={16} />
                      </div>
                      <div className="queue-item-details">
                        <div className="queue-item-title">
                          ✓ Quiz attempt
                          <span className="item-badge-score">Score: {q.score}/{q.totalQuestions}</span>
                        </div>
                        <div className="queue-item-sub">
                          Lecture: <strong>{q.lectureId}</strong>
                        </div>
                      </div>
                      <span className="queue-state-pill">
                        {syncState === 'syncing' ? 'Syncing...' : 'Queued'}
                      </span>
                    </div>
                  ))
                ) : pendingAttempts.length > 0 ? (
                  <div className="queue-item-card">
                    <div className="queue-item-icon quiz-type">
                      <Check size={16} />
                    </div>
                    <div className="queue-item-details">
                      <div className="queue-item-title">
                        ✓ Quiz attempt ({pendingAttempts.length} answers)
                      </div>
                      <div className="queue-item-sub">
                        Lecture: <strong>{pendingAttempts[0].lectureId}</strong>
                      </div>
                    </div>
                    <span className="queue-state-pill">
                      {syncState === 'syncing' ? 'Syncing...' : 'Queued'}
                    </span>
                  </div>
                ) : null}

                {/* Doubts in Queue */}
                {pendingDoubts.map((d, idx) => (
                  <div key={`doubt-${d.doubtId || idx}`} className="queue-item-card">
                    <div className="queue-item-icon doubt-type">
                      <HelpCircle size={16} />
                    </div>
                    <div className="queue-item-details">
                      <div className="queue-item-title">
                        ✓ Doubt at {d.timestamp}
                      </div>
                      <div className="queue-item-sub">
                        "{d.text.length > 60 ? d.text.substring(0, 60) + '...' : d.text}"
                      </div>
                    </div>
                    <span className="queue-state-pill">
                      {syncState === 'syncing' ? 'Syncing...' : 'Queued'}
                    </span>
                  </div>
                ))}

                {totalPendingUnits === 0 && (
                  <div className="empty-queue-message">
                    <CheckCircle2 size={32} color="#10b981" />
                    <p>No offline learning data pending sync. You are completely up to date!</p>
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
              <h3 className="sync-success-title">Everything synced successfully ✓</h3>
              <p className="sync-success-body">
                Your learning data was synced during the available connection.
              </p>

              <div className="sync-summary-card">
                <div className="summary-stat-row">
                  <span className="stat-label">Synced Records</span>
                  <span className="stat-value">
                    {syncedCounts.quizzes} quiz{syncedCounts.quizzes !== 1 ? 'zes' : ''}, {syncedCounts.doubts} doubt{syncedCounts.doubts !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="summary-stat-row">
                  <span className="stat-label">Local Storage Status</span>
                  <span className="stat-value highlight-green">Marked Synced (Preserved)</span>
                </div>
                <div className="summary-stat-row">
                  <span className="stat-label">Pending Sync Count</span>
                  <span className="stat-value">0</span>
                </div>
                <div className="summary-stat-row">
                  <span className="stat-label">Last synced:</span>
                  <span className="stat-value timestamp-val">{lastSyncedTime}</span>
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
