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
  import { StudentHome } from './components/StudentHome.jsx';
  import { StudentDownloads } from './components/StudentDownloads.jsx';
  import { StudentProfile } from './components/StudentProfile.jsx';
  import { TeacherQuizManager } from './components/TeacherQuizManager.jsx';
  import { LoginPage } from './components/LoginPage.jsx';
  import { CURRICULUM_DATA } from './data/curriculumData.js';

  import {
    Plus,
    BookOpen,
    ShieldCheck,
    RotateCw,
    Search,
    Sparkles,
    AlertTriangle,
    GraduationCap,
  } from 'lucide-react';

  export default function App() {
    const [role, setRole] = useState(null);
    const [currentView, setCurrentView] = useState('login');
    const [selectedQuizLecture, setSelectedQuizLecture] = useState(null);
    const [selectedVideoLecture, setSelectedVideoLecture] = useState(null);
    const [selectedDownloadLecture, setSelectedDownloadLecture] = useState(null);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLecture, setSelectedLecture] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [quizLecture, setQuizLecture] = useState(null);
    const [analytics, setAnalytics] = useState({ progress: [], quizAttempts: [], quizSubmissions: [], doubts: [] });

    const handleLogin = (nextRole) => {
      window.localStorage.setItem('vidya-setu-role', nextRole);
      setRole(nextRole);
      setCurrentView(nextRole === 'teacher' ? 'teacher' : 'student-home');
    };

    const handleLogout = () => {
      window.localStorage.removeItem('vidya-setu-role');
      setRole(null);
      setCurrentView('login');
    };

    useEffect(() => {
      window.localStorage.removeItem('vidya-setu-role');
    }, []);

  // Initialize pending sync count from IndexedDB & listen for online events
  useEffect(() => {
    const refreshCount = () => {
      getPendingSyncCount()
        .then((count) => setPendingSyncCount(count))
        .catch((e) => console.warn('Could not read IndexedDB count:', e));
    };

    refreshCount();

    // Auto-open MicroSync modal if connection is detected and there are pending items (Student view only)
    const handleOnline = async () => {
      console.log('[MicroSync] Connection detected! Checking pending records...');
      const count = await getPendingSyncCount().catch(() => 0);
      setPendingSyncCount(count);
      if (count > 0 && currentView === 'student-quiz') {
        setIsSyncModalOpen(true);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentView]);

    const fetchLectures = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/lectures');
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch lectures');
        setLectures(data.lectures || []);
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
      fetch('/api/teacher/analytics')
        .then((response) => response.ok ? response.json() : null)
        .then((data) => data?.success && setAnalytics(data))
        .catch(() => {});
    }, []);

    const handlePublishedSuccess = () => fetchLectures();
    const handleUpdatedSuccess = () => fetchLectures();
    const handleReplyToDoubt = async (doubtId) => {
      const reply = window.prompt('Teacher reply');
      if (!reply?.trim()) return;
      const response = await fetch(`/api/doubts/${encodeURIComponent(doubtId)}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply }),
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics((current) => ({ ...current, doubts: current.doubts.map((doubt) => doubt.doubtId === doubtId ? data.doubt : doubt) }));
      }
    };
    const filteredLectures = lectures.filter((lec) => {
      const q = searchQuery.toLowerCase();
      return lec.title?.toLowerCase().includes(q) || lec.courseId?.toLowerCase().includes(q) || lec.subject?.toLowerCase().includes(q) || lec.description?.toLowerCase().includes(q);
    });
    const verifiedCount = lectures.filter((l) => l.versionDetails?.verificationStatus === 'verified').length;
    const v2Count = lectures.filter((l) => l.currentVersion === 'V2').length;
    const handleStudentLectureSelect = (lecture) => {
      if (lecture.action === 'quiz' || lecture.resourceType === 'Quiz') {
        setSelectedQuizLecture(lecture);
        setSelectedVideoLecture(null);
        setCurrentView('student-quiz');
      } else if (lecture.action === 'open-resource' && lecture.resourceType !== 'Video') {
        if (lecture.fileUrl) {
          window.open(lecture.fileUrl, '_blank', 'noopener,noreferrer');
        } else {
          setSelectedDownloadLecture(lecture);
          setCurrentView('student-downloads');
        }
      } else if (lecture.action === 'watch') {
        setSelectedVideoLecture(lecture);
        setSelectedQuizLecture(null);
        setCurrentView('student-offline-player');
      } else {
        setSelectedQuizLecture(lecture);
        setSelectedVideoLecture(null);
        setCurrentView('student-quiz');
      }
    };

    const handleStudentDownloadRequest = (lecture) => {
      setSelectedDownloadLecture(lecture);
      console.info('[Download] Member 2 integration point:', {
        lectureId: lecture.lectureId,
        versionId: lecture.versionId,
      });
      setCurrentView('student-downloads');
    };

    const handleStudentVersionUpdate = (lecture) => {
      setSelectedDownloadLecture(lecture);
      console.info('[Version Update] Member 2 integration point:', {
        lectureId: lecture.lectureId,
        versionId: lecture.versionId,
      });
      setCurrentView('student-downloads');
    };

    const handleStudentWatch = (lecture) => {
      handleStudentLectureSelect({ ...lecture, action: 'watch' });
    };

    const handleStudentQuiz = (lecture) => {
      handleStudentLectureSelect({ ...lecture, action: 'quiz' });
    };

    const continueLearningLecture = CURRICULUM_DATA
      .flatMap((course) => course.subjects.flatMap((subject) => subject.lectures.map((lecture) => ({
        ...lecture,
        courseName: course.courseName,
        subjectName: subject.subjectName,
        versionId: lecture.versionId || `${lecture.lectureId}_${(lecture.version || 'V1').toLowerCase()}`,
      })))).find((lecture) => lecture.lectureId === 'lec_math10_quad_01');
    const latestContinueLearningRecord = lectures
      .find((lecture) => lecture.lectureId === continueLearningLecture?.lectureId);
    const latestContinueLearningVersion = latestContinueLearningRecord?.versionDetails
      ? {
          ...latestContinueLearningRecord.versionDetails,
          version: latestContinueLearningRecord.currentVersion,
        }
      : null;

  if (!role) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="app-container">
      {[
        'student-home',
        'student-courses',
        'student-quiz',
        'student-downloads',
        'student-offline-player',
        'student-profile',
      ].includes(currentView) ? (
        <header className="student-header">
          <div className="student-header-inner">
            <strong className="student-brand">Vidya Setu</strong>
            <nav className="student-nav" aria-label="Student navigation">
              <button className={currentView === 'student-home' ? 'student-nav-link active' : 'student-nav-link'} onClick={() => setCurrentView('student-home')}>Home</button>
              <button className={['student-courses', 'student-quiz'].includes(currentView) ? 'student-nav-link active' : 'student-nav-link'} onClick={() => setCurrentView('student-courses')}>Courses</button>
              <button className={['student-downloads', 'student-offline-player'].includes(currentView) ? 'student-nav-link active' : 'student-nav-link'} onClick={() => setCurrentView('student-downloads')}>Downloads</button>
              <button className={currentView === 'student-profile' ? 'student-nav-link active' : 'student-nav-link'} onClick={() => setCurrentView('student-profile')}>Profile</button>
              <button
                className={`student-nav-link ${currentView === 'student-quiz' ? 'active' : ''}`}
                onClick={() => setCurrentView('student-quiz')}
                id="student-practice-quiz-nav"
              >
                <GraduationCap size={15} /> Practice Quiz (Offline)
                {pendingSyncCount > 0 && (
                  <span className="nav-pending-dot" title={`${pendingSyncCount} pending sync`}>
                    {pendingSyncCount}
                  </span>
                )}
              </button>
              <button className="student-nav-link" onClick={() => setCurrentView('teacher')}>Teacher Portal</button>
            </nav>
            <button type="button" className="session-logout-btn" onClick={handleLogout}>Log out</button>
          </div>
        </header>
      ) : (
        <Navbar
          currentView={currentView}
          onViewChange={setCurrentView}
          pendingSyncCount={pendingSyncCount}
          onOpenSync={() => setIsSyncModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      <main className="main-wrapper">
        {currentView === 'student-home' ? (
          <StudentHome
            onViewAllCourses={() => {
              setSelectedCourseId(null);
              setCurrentView('student-courses');
            }}
            onSelectCourse={(courseId) => {
              setSelectedCourseId(courseId);
              setCurrentView('student-courses');
            }}
            onResumeLecture={handleStudentWatch}
            onPracticeQuiz={handleStudentQuiz}
            onVersionUpdate={handleStudentVersionUpdate}
            latestVersion={latestContinueLearningVersion}
            continueLearningLecture={continueLearningLecture}
          />
        ) : currentView === 'student-courses' ? (
          <StudentCourseBrowser
            teacherLectures={lectures}
            onSelectLecture={handleStudentLectureSelect}
            onDownloadLecture={handleStudentDownloadRequest}
            onOpenResource={handleStudentLectureSelect}
            initialCourseId={selectedCourseId}
          />
        ) : currentView === 'student-downloads' ? (
          <StudentDownloads
            lecture={selectedDownloadLecture}
            teacherLectures={lectures}
            onWatchOffline={(lecture) => handleStudentLectureSelect({ ...lecture, action: 'watch' })}
            onOpenLecture={(lecture) => handleStudentLectureSelect({
              ...lecture,
              action: lecture.resourceType === 'Video' ? 'watch' : 'open-resource',
            })}
            onStartDownload={(lecture) => handleStudentDownloadRequest(lecture)}
            onOpenResource={handleStudentLectureSelect}
          />
        ) : currentView === 'student-profile' ? (
          <StudentProfile />
        ) : currentView === 'student-offline-player' ? (
          <OfflineVideoPlayer
            lecture={selectedVideoLecture}
            onPracticeQuiz={(lecture) => {
              setSelectedQuizLecture(lecture);
              setSelectedVideoLecture(null);
              setCurrentView('student-quiz');
            }}
            onBackToLectures={() => {
              setSelectedVideoLecture(null);
              setCurrentView('student-downloads');
            }}
            onPendingSyncChange={(count) => setPendingSyncCount(count)}
          />
        ) : currentView === 'student-quiz' ? (
          /* PART 3 & PART 4: OFFLINE STUDENT COURSE HIERARCHY, VIDEO & QUIZ */
          selectedVideoLecture ? (
            <OfflineVideoPlayer
              lecture={selectedVideoLecture}
              onPracticeQuiz={(lecture) => {
                setSelectedQuizLecture(lecture);
                setSelectedVideoLecture(null);
              }}
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
              pendingSyncCount={pendingSyncCount}
              onOpenSync={() => setIsSyncModalOpen(true)}
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
            <div className="teacher-dashboard-layout">
            {/* Dashboard Top Header */}
            <div className="dashboard-header">
              <div className="header-title">
                <h2>Teacher Dashboard</h2>
                <p>Publish, verify and manage master lecture versions (V1 & V2) for Vidya Setu</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
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
                <div className="stat-icon-wrapper" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <div className="stat-label">Total Lectures</div>
                  <div className="stat-value">{lectures.length}</div>
                  <div className="stat-label">Published Packages</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green"><GraduationCap size={22} /></div>
                <div className="stat-content">
                  <div className="stat-value">{analytics.quizSubmissions.length}</div>
                  <div className="stat-label">Student Quiz Results</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper" style={{ background: '#fff7ed', color: '#c2410c' }}><AlertTriangle size={22} /></div>
                <div className="stat-content">
                  <div className="stat-value">{analytics.doubts.length}</div>
                  <div className="stat-label">Student Doubts</div>
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
                    onManageQuiz={(lectureToManage) => setQuizLecture(lectureToManage)}
                  />
                ))}
              </div>
            )}
            </div>

            {analytics.doubts.length > 0 && (
              <section style={{ marginTop: '2rem' }}>
                <div className="section-toolbar"><h3>Student Doubts</h3><span className="badge badge-published">{analytics.doubts.length} total</span></div>
                <div className="lecture-grid">
                  {analytics.doubts.map((doubt) => (
                    <div className="lecture-card" key={doubt.doubtId}>
                      <div><span className="badge badge-v1">{doubt.timestamp}</span><h4 className="lecture-card-title">{doubt.text}</h4><p className="lecture-card-desc">Lecture: {doubt.lectureId}</p><p className="lecture-card-desc">{doubt.teacherReply ? `Reply: ${doubt.teacherReply}` : 'Needs teacher reply'}</p></div>
                      {!doubt.teacherReply && <button type="button" className="btn btn-primary" onClick={() => handleReplyToDoubt(doubt.doubtId)}>Reply</button>}
                    </div>
                  ))}
                </div>
              </section>
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

      <TeacherQuizManager
        isOpen={!!quizLecture}
        lecture={quizLecture}
        onClose={() => setQuizLecture(null)}
        onSaved={(updatedLecture) => {
          setQuizLecture(updatedLecture);
          fetchLectures();
        }}
      />

      {/* MicroSync Modal (Part 5 Flow) */}
      <MicroSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        lectures={lectures}
        onSyncComplete={(remainingCount) => {
          setPendingSyncCount(remainingCount);
        }}
      />
    </div>
  );
}


