import React, { useState, useEffect, useRef } from 'react';
import {
  saveOfflineDoubt,
  getDoubtsForLecture,
  getPendingSyncCount,
} from '../utils/indexedDB.js';
import { saveProgressToBackend } from '../utils/backendApi.js';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Clock,
  CheckCircle2,
  WifiOff,
  ArrowLeft,
  X,
  Send,
  MessageSquare,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { getQuizForLecture } from '../data/curriculumData.js';

export const OfflineVideoPlayer = ({ lecture, onBackToLectures, onPendingSyncChange, onPracticeQuiz }) => {
  const quizData = getQuizForLecture(lecture);
  // Parse initial timestamp if provided (e.g. from Review Correction click)
  const parseTimestampToSec = (ts) => {
    if (!ts || typeof ts !== 'string') return null;
    const parts = ts.trim().split(':');
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10);
      const sec = parseInt(parts[1], 10);
      if (!isNaN(min) && !isNaN(sec)) return min * 60 + sec;
    }
    return null;
  };

  const initialSec = parseTimestampToSec(
    lecture?.initialTimestamp || lecture?.versionDetails?.correctionDetails?.timestamp
  );

  // Video Playback Simulation / Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(
    initialSec !== null ? initialSec : 1122 // If correction timestamp exists, start there; else default 18:42
  );
  const [durationSec] = useState(2700); // 45:00 total duration
  const [isMuted, setIsMuted] = useState(false);

  // Doubts State
  const [savedDoubts, setSavedDoubts] = useState([]);
  const [isDoubtModalOpen, setIsDoubtModalOpen] = useState(false);
  const [capturedTimestamp, setCapturedTimestamp] = useState('00:00');
  const [doubtText, setDoubtText] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const animationFrameRef = useRef(null);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Load existing doubts from IndexedDB for this lecture
  const loadLectureDoubts = async () => {
    if (!lecture?.lectureId) return;
    try {
      const doubts = await getDoubtsForLecture(lecture.lectureId);
      setSavedDoubts(doubts);
      const count = await getPendingSyncCount();
      if (onPendingSyncChange) onPendingSyncChange(count);
    } catch (err) {
      console.error('Error loading offline doubts:', err);
    }
  };

  useEffect(() => {
    loadLectureDoubts();
  }, [lecture?.lectureId]);

  // Video playback timer
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= durationSec) {
            setIsPlaying(false);
            return durationSec;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, durationSec]);

  // When student taps "Ask a Doubt", automatically capture current timestamp
  const handleOpenAskDoubt = () => {
    // Pause video when asking a doubt
    setIsPlaying(false);
    const autoTimestamp = formatTime(currentTimeSec);
    setCapturedTimestamp(autoTimestamp);
    setDoubtText('');
    setSaveSuccessMessage(null);
    setIsDoubtModalOpen(true);
  };

  // Save Doubt Offline
  const handleSaveDoubt = async (e) => {
    e.preventDefault();
    if (!doubtText.trim()) return;

    setIsSaving(true);
    try {
      const savedRecord = await saveOfflineDoubt({
        lectureId: lecture.lectureId,
        timestamp: capturedTimestamp,
        text: doubtText.trim(),
      });

      // Update local state and reload list
      await loadLectureDoubts();

      // Show confirmation explicitly requested:
      // "✓ Doubt saved offline"
      // "This doubt will sync when connectivity returns."
      // Status: "Pending Sync"
      setSaveSuccessMessage({
        title: '✓ Doubt saved offline',
        subtitle: 'This doubt will sync when connectivity returns.',
        status: 'Pending Sync',
        record: savedRecord,
      });

      setDoubtText('');
    } catch (err) {
      console.error('Error saving doubt offline:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSeek = (e) => {
    const newSec = Number(e.target.value);
    setCurrentTimeSec(newSec);
    if (lecture?.versionId) {
      saveProgressToBackend({ lectureId: lecture.lectureId, versionId: lecture.versionId, playbackPosition: newSec, syncStatus: 'Synced' }).catch(() => {});
    }
  };

  const handleJumpTo = (secs) => {
    setCurrentTimeSec(secs);
    if (lecture?.versionId) {
      saveProgressToBackend({ lectureId: lecture.lectureId, versionId: lecture.versionId, playbackPosition: secs, syncStatus: 'Synced' }).catch(() => {});
    }
  };

  return (
    <div className="offline-player-wrapper">
      {/* Top Header Bar */}
      <div className="player-top-bar">
        <button type="button" className="btn-back-link" onClick={onBackToLectures}>
          <ArrowLeft size={16} /> Back to Lectures
        </button>

        <div className="player-meta-badges">
          <span className="badge badge-available-offline">
            <WifiOff size={13} />
            Available Offline
          </span>
          <span className={`badge ${(lecture.currentVersion || lecture.version) === 'V2' ? 'badge-v2' : 'badge-v1'}`}>
            <Sparkles size={12} />
            {lecture.currentVersion || lecture.version || 'V1'}
          </span>
          <span className="badge badge-verified">
            Verified
          </span>
          {quizData?.questions?.length > 0 && onPracticeQuiz && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onPracticeQuiz(lecture)}
            >
              <GraduationCap size={15} /> Practice Quiz
            </button>
          )}
        </div>
      </div>

      <div className="player-title-row">
        <h2 className="player-lecture-title">{lecture.title}</h2>
        <span className="player-course-subtitle">
          {lecture.courseName || 'Class 10 Mathematics'} • {lecture.subjectName || lecture.subject || 'Quadratic Equations'}
        </span>
      </div>

      {/* Correction Capsule Banner (V1 -> V2) */}
      {(lecture.reviewCorrection || lecture.versionDetails?.correctionDetails?.hasCorrection || (lecture.currentVersion === 'V2' && lecture.versionDetails?.correctionDetails?.note)) && (
        <div className="correction-capsule-banner" style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '0.85rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1d4ed8',
              flexShrink: 0,
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ color: '#1e3a8a', fontSize: '0.925rem' }}>Correction Capsule (V1 → V2)</strong>
                <span className="badge badge-v2" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>Active V2</span>
              </div>
              <p style={{ margin: '0.15rem 0 0', color: '#1e40af', fontSize: '0.85rem' }}>
                {lecture.versionDetails?.correctionDetails?.note || 'Corrected mathematical derivations and sign conventions in this lecture.'}
              </p>
            </div>
          </div>

          {lecture.versionDetails?.correctionDetails?.timestamp && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ background: '#ffffff', borderColor: '#93c5fd', color: '#1d4ed8', fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
              onClick={() => {
                const sec = parseTimestampToSec(lecture.versionDetails.correctionDetails.timestamp);
                if (sec !== null) handleJumpTo(sec);
              }}
              title="Jump directly to correction timestamp"
            >
              <Clock size={14} />
              Jump to Correction ({lecture.versionDetails.correctionDetails.timestamp})
            </button>
          )}
        </div>
      )}

      {/* Main Video Screen Container */}
      <div className="video-viewport-card">
        <div className="simulated-video-display">
          {/* Virtual Blackboard / Screen Overlay */}
          <div className="video-chalkboard">
            <div className="chalkboard-lecture-pill">
              <Sparkles size={14} /> Vidya Setu Master Lecture • {lecture.lectureId}
            </div>
            <h3 className="chalkboard-main-text">{lecture.title}</h3>
            <p className="chalkboard-sub-text">
              Offline Playback Stream • Current Position: <strong>{formatTime(currentTimeSec)}</strong>
            </p>
            <div className="chalkboard-wave">
              <div className={`audio-bar ${isPlaying ? 'animating' : ''}`} />
              <div className={`audio-bar ${isPlaying ? 'animating' : ''}`} />
              <div className={`audio-bar ${isPlaying ? 'animating' : ''}`} />
              <div className={`audio-bar ${isPlaying ? 'animating' : ''}`} />
              <div className={`audio-bar ${isPlaying ? 'animating' : ''}`} />
            </div>
          </div>

          {/* Floating Current Timestamp Pill */}
          <div className="video-overlay-timestamp" id="video-current-timestamp">
            <Clock size={14} />
            <span>{formatTime(currentTimeSec)}</span>
          </div>
        </div>

        {/* Custom Video Controls */}
        <div className="video-controls-panel">
          {/* Progress Scrubber */}
          <div className="scrubber-row">
            <input
              type="range"
              min={0}
              max={durationSec}
              value={currentTimeSec}
              onChange={handleSeek}
              className="video-scrubber-slider"
              id="video-scrubber"
            />
          </div>

          <div className="controls-button-row">
            <div className="controls-left">
              <button
                type="button"
                className="video-control-btn play-pause-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                id="play-pause-btn"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button
                type="button"
                className="video-control-btn"
                onClick={() => setCurrentTimeSec(0)}
                title="Restart"
              >
                <RotateCcw size={16} />
              </button>

              <button
                type="button"
                className="video-control-btn"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Time readout: current / total */}
              <div className="video-time-readout">
                <span className="current-time">{formatTime(currentTimeSec)}</span>
                <span className="time-divider">/</span>
                <span className="total-duration">{formatTime(durationSec)}</span>
              </div>

              {/* Quick Jump Buttons for demonstration & testing */}
              <div className="quick-jump-chips">
                <button
                  type="button"
                  className="quick-time-chip"
                  onClick={() => handleJumpTo(1122)} // 18:42
                  id="jump-18-42-btn"
                  title="Jump to 18:42"
                >
                  Jump to 18:42
                </button>
                <button
                  type="button"
                  className="quick-time-chip"
                  onClick={() => handleJumpTo(330)} // 05:30
                  title="Jump to 05:30"
                >
                  05:30
                </button>
              </div>
            </div>

            <div className="controls-right">
              {/* Prominent "Ask a Doubt" Button */}
              <button
                type="button"
                className="btn btn-ask-doubt"
                onClick={handleOpenAskDoubt}
                id="ask-a-doubt-btn"
              >
                <HelpCircle size={16} />
                Ask a Doubt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Doubts for this Lecture Section */}
      <div className="saved-doubts-section">
        <div className="saved-doubts-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MessageSquare size={18} style={{ color: '#2563eb' }} />
            <h3>Saved Doubts for this Lecture</h3>
          </div>
          <span className="badge badge-pending-sync">
            {savedDoubts.length} Doubt{savedDoubts.length !== 1 ? 's' : ''} Saved Offline
          </span>
        </div>

        {savedDoubts.length === 0 ? (
          <div className="empty-doubts-box">
            <HelpCircle size={28} style={{ color: '#94a3b8', margin: '0 auto 0.5rem' }} />
            <p>No doubts asked yet for this lecture.</p>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Pause at any point in the video and tap “Ask a Doubt” to record your question offline.
            </span>
          </div>
        ) : (
          <div className="doubts-cards-grid">
            {savedDoubts.map((d) => (
              <div key={d.doubtId} className="doubt-item-card">
                <div className="doubt-card-top">
                  {/* Clickable timestamp chip that seeks to that moment */}
                  <button
                    type="button"
                    className="doubt-timestamp-pill"
                    onClick={() => {
                      const parts = d.timestamp.split(':');
                      if (parts.length === 2) {
                        const sec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                        handleJumpTo(sec);
                      }
                    }}
                    title="Jump video to this timestamp"
                  >
                    <Clock size={12} />
                    <span>{d.timestamp}</span>
                  </button>

                  <span className={`badge ${d.status === 'synced' ? 'badge-synced' : 'badge-pending-sync'}`}>
                    {d.status === 'synced' ? 'Synced' : 'Pending Sync'}
                  </span>
                </div>

                <p className="doubt-text">{d.text}</p>

                <div className="doubt-card-footer">
                  <span className="mono" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    ID: {d.doubtId.substring(0, 16)}...
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Saved Offline
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ask a Doubt Modal / Bottom Sheet */}
      {isDoubtModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDoubtModalOpen(false)}>
          <div className="modal-card doubt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} style={{ color: '#2563eb' }} />
                <h3>Ask a doubt</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsDoubtModalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {saveSuccessMessage ? (
              /* Confirmation Screen View */
              <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="success-badge-icon">
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#065f46', marginBottom: '0.4rem' }}>
                  {saveSuccessMessage.title}
                </h3>
                <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                  {saveSuccessMessage.subtitle}
                </p>

                <div className="success-summary-box" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                  <div className="success-summary-row">
                    <span className="summary-label">Timestamp:</span>
                    <span className="summary-val mono" style={{ color: '#2563eb', fontWeight: 700 }}>
                      {saveSuccessMessage.record.timestamp}
                    </span>
                  </div>
                  <div className="success-summary-row">
                    <span className="summary-label">Status:</span>
                    <span className="badge badge-pending-sync">
                      {saveSuccessMessage.status}
                    </span>
                  </div>
                  <div className="success-summary-row">
                    <span className="summary-label">Doubt:</span>
                    <span className="summary-val" style={{ maxWidth: '280px', overflowWrap: 'break-word' }}>
                      {saveSuccessMessage.record.text}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setIsDoubtModalOpen(false)}
                  id="close-doubt-confirm-btn"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Doubt Entry Form */
              <form onSubmit={handleSaveDoubt}>
                <div className="modal-body">
                  {/* Automatic Captured Timestamp Display as required */}
                  <div className="form-group">
                    <label className="form-label" style={{ marginBottom: '0.25rem' }}>
                      Timestamp:
                    </label>
                    <div className="auto-timestamp-pill" id="auto-captured-timestamp">
                      <Clock size={16} />
                      <strong>{capturedTimestamp}</strong>
                      <span className="timestamp-auto-tag">Automatically Captured</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                      Captured directly from video player position. No manual entry needed.
                    </span>
                  </div>

                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label className="form-label" htmlFor="doubt-textarea">
                      What is your doubt about this part? <span className="required">*</span>
                    </label>
                    <textarea
                      id="doubt-textarea"
                      className="form-textarea"
                      rows={4}
                      placeholder="e.g. How do we factorize when the middle term is negative? Or why did we choose roots x = 2 and 3?"
                      value={doubtText}
                      onChange={(e) => setDoubtText(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setIsDoubtModalOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving || !doubtText.trim()}
                    id="save-doubt-offline-btn"
                  >
                    <Send size={15} />
                    Save Doubt Offline
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
