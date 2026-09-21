import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { LectureCard } from './components/LectureCard.jsx';
import { CreateLectureModal } from './components/CreateLectureModal.jsx';
import { LectureDetailsModal } from './components/LectureDetailsModal.jsx';
import { StudentQuiz } from './components/StudentQuiz.jsx';
import { StudentCourseBrowser } from './components/StudentCourseBrowser.jsx';
import { OfflineVideoPlayer } from './components/OfflineVideoPlayer.jsx';
import { MicroSyncModal } from './components/MicroSyncModal.jsx';
import { getPendingSyncCount } from './utils/indexedDB.js';

import {
  Plus,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  RotateCw,
  Search,
  Sparkles,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('teacher'); // 'teacher' | 'student-quiz'
  const [selectedQuizLecture, setSelectedQuizLecture] = useState(null);
  const [selectedVideoLecture, setSelectedVideoLecture] = useState(null);

  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Initialize pending sync count from IndexedDB & listen for online events
  useEffect(() => {
    const refreshCount = () => {
      getPendingSyncCount()
        .then((count) => setPendingSyncCount(count))
        .catch((e) => console.warn('Could not read IndexedDB count:', e));
    };

    refreshCount();

    // Auto-open MicroSync modal if connection is detected and there are pending items
    const handleOnline = async () => {
      console.log('[MicroSync] Connection detected! Checking pending records...');
      const count = await getPendingSyncCount().catch(() => 0);
      setPendingSyncCount(count);
      if (count > 0) {
        setIsSyncModalOpen(true);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/lectures');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch lectures');
      }

      setLectures(data.lectures || []);

      // If a lecture was selected, keep it updated
      if (selectedLecture) {
        const updated = data.lectures?.find((l) => l.lectureId === selectedLecture.lectureId);
        if (updated) setSelectedLecture(updated);
      }
    } catch (err) {
      console.error('Fetch lectures error:', err);
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  const handlePublishedSuccess = () => {
    fetchLectures();
  };

  const handleUpdatedSuccess = () => {
    fetchLectures();
  };

  const filteredLectures = lectures.filter((lec) => {
    const q = searchQuery.toLowerCase();
    return (
      lec.title?.toLowerCase().includes(q) ||
      lec.courseId?.toLowerCase().includes(q) ||
      lec.subject?.toLowerCase().includes(q) ||
      lec.description?.toLowerCase().includes(q)
    );
  });

  const verifiedCount = lectures.filter(
    (l) => l.versionDetails?.verificationStatus === 'verified'
  ).length;

  const v2Count = lectures.filter((l) => l.currentVersion === 'V2').length;

  return (
    <div className="app-container">
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        pendingSyncCount={pendingSyncCount}
        onOpenSync={() => setIsSyncModalOpen(true)}
      />

      <main className="main-wrapper">
        {currentView === 'student-quiz' ? (
          /* PART 3 & PART 4: OFFLINE STUDENT COURSE HIERARCHY, VIDEO & QUIZ */
          selectedVideoLecture ? (
            <OfflineVideoPlayer
              lecture={selectedVideoLecture}
              onBackToLectures={() => setSelectedVideoLecture(null)}
              onPendingSyncChange={(count) => setPendingSyncCount(count)}
            />
          ) : selectedQuizLecture ? (
            <StudentQuiz
              lecture={selectedQuizLecture}
              onBackToLectures={() => setSelectedQuizLecture(null)}
              onPendingSyncChange={(count) => setPendingSyncCount(count)}
            />
          ) : (
            <StudentCourseBrowser
              teacherLectures={lectures}
              onSelectLecture={(lec) => {
                if (lec.action === 'watch') {
                  setSelectedVideoLecture(lec);
                  setSelectedQuizLecture(null);
                } else {
                  setSelectedQuizLecture(lec);
                  setSelectedVideoLecture(null);
                }
              }}
            />
          )
        ) : (
          /* PARTS 1 & 2: TEACHER DASHBOARD VIEW */


          <>
            {/* Dashboard Top Header */}
            <div className="dashboard-header">
              <div className="header-title">
                <h2>Teacher Dashboard</h2>
                <p>Publish, verify and manage master lecture versions (V1 & V2) for Vidya Setu</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentView('student-quiz')}
                  id="switch-to-quiz-btn"
                >
                  <GraduationCap size={16} />
                  Practice Quiz (Offline)
                  {pendingSyncCount > 0 && (
                    <span className="badge badge-pending-inline">
                      {pendingSyncCount} Pending
                    </span>
                  )}
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => setIsModalOpen(true)}
                  id="create-lecture-btn"
                >
                  <Plus size={18} />
                  Create Lecture
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <BookOpen size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{lectures.length}</div>
                  <div className="stat-label">Total Master Lectures</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <Sparkles size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {lectures.length} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>({v2Count} at V2)</span>
                  </div>
                  <div className="stat-label">Published Packages</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <ShieldCheck size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{verifiedCount}</div>
                  <div className="stat-label">Verified Packages</div>
                </div>
              </div>
            </div>

            {/* Lectures List Toolbar */}
            <div className="section-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h3>Lectures Repository</h3>
                <span className="badge badge-published" style={{ fontSize: '0.75rem' }}>
                  {lectures.length} Published
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search lectures..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2rem', height: '38px', width: '220px' }}
                  />
                </div>

                <button
                  className="btn btn-outline"
                  onClick={fetchLectures}
                  disabled={loading}
                  title="Refresh lecture list"
                >
                  <RotateCw size={15} className={loading ? 'spinner' : ''} />
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="error-banner">
                <AlertTriangle size={20} />
                <div>
                  <strong>Error loading lectures:</strong> {error}
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && lectures.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#64748b' }}>
                <RotateCw size={32} className="spinner" style={{ margin: '0 auto 1rem', color: '#2563eb' }} />
                <p>Loading published lectures from server...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && lectures.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <BookOpen size={30} />
                </div>
                <h4>No Lectures Published Yet</h4>
                <p>
                  Get started by creating your first master course lecture and uploading a sample file to publish V1.
                </p>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                  <Plus size={16} />
                  Create Lecture Now
                </button>
              </div>
            )}

            {/* Lecture Grid */}
            {filteredLectures.length > 0 && (
              <div className="lecture-grid">
                {filteredLectures.map((lec) => (
                  <LectureCard
                    key={lec.lectureId}
                    lecture={lec}
                    onOpenLecture={(lectureToOpen) => setSelectedLecture(lectureToOpen)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Lecture Modal (Part 1 V1 Flow) */}
      <CreateLectureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPublishedSuccess={handlePublishedSuccess}
      />

      {/* Lecture Details & V2 Update Modal (Part 2 Flow) */}
      <LectureDetailsModal
        isOpen={!!selectedLecture}
        lecture={selectedLecture}
        onClose={() => setSelectedLecture(null)}
        onUpdatedSuccess={handleUpdatedSuccess}
      />

      {/* MicroSync Modal (Part 5 Flow) */}
      <MicroSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncComplete={(remainingCount) => {
          setPendingSyncCount(remainingCount);
        }}
      />
    </div>
  );
}


