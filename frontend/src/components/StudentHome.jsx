import React, { useState } from 'react';
import { CURRICULUM_DATA } from '../data/curriculumData.js';
import {
  Wifi,
  Sparkles,
  AlertTriangle,
  Play,
  Clock,
  CheckCircle2,
  BookOpen,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const StudentHome = ({
  onViewAllCourses,
  onSelectCourse,
  onResumeLecture,
  onPracticeQuiz,
  continueLearningLecture,
  onVersionUpdate,
  latestVersion,
}) => {
  const [correctionReviewed, setCorrectionReviewed] = useState(false);
  const student = {
    networkStatus: typeof navigator !== 'undefined' && navigator.onLine ? 'Online' : 'Offline',
  };

  const importantUpdates = [
    {
      id: 'upd-1',
      title: 'Lecture Updated — V2 available — Needs Review',
      version: 'V2',
      status: 'Needs Review',
      description: 'Mathematics: Quadratic Equations updated with revised explanations. V1 preserved.',
    },
    {
      id: 'upd-2',
      title: 'Teacher Correction — View Correction',
      status: 'Teacher Correction',
      description: 'Discriminant calculation formula sign convention note from the teacher.',
    },
  ];

  const continueLearning = {
    lectureId: 'lec_math10_quad_01',
    courseName: 'Mathematics',
    title: 'Solving Quadratic Equations',
    version: 'V1',
    status: 'Available Offline', // Contract status
    learningProgress: 0,
    progressPercent: 68,
    timestamp: '18:42 / 27:30',
  };
  const activeContinueLearning = continueLearningLecture || continueLearning;
  const learningProgress = Number.isFinite(activeContinueLearning.learningProgress)
    ? activeContinueLearning.learningProgress
    : 0;

  const myCourses = CURRICULUM_DATA.slice(0, 3);
  const coursePreview = myCourses.map((course) => ({
    ...course,
    lectureCount: course.subjects.reduce((count, subject) => count + subject.lectures.length, 0),
  }));

  const recentActivity = [
    {
      id: 'act-1',
      title: 'Practice Quiz: Solving Quadratic Equations',
      meta: 'Score: 5/5 (100% Accuracy)',
      timestamp: 'Today, 11:20 AM',
      syncStatus: 'Pending Sync', // Contract status
      badgeClass: 'badge-pending-sync',
    },
    {
      id: 'act-2',
      title: 'Doubt Recorded at 18:42',
      meta: 'Factorization when middle term is negative',
      timestamp: 'Today, 10:45 AM',
      syncStatus: 'Pending Sync', // Contract status
      badgeClass: 'badge-pending-sync',
    },
    {
      id: 'act-3',
      title: 'Lecture Package Stored Offline',
      meta: 'lec_math10_quad_01 • SHA-256 Verified',
      timestamp: 'Yesterday',
      syncStatus: 'Synced', // Contract status
      badgeClass: 'badge-verified',
    },
  ];
  return (
    <div className="student-home-content student-dashboard-layout" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. GREETING & ONLINE STATUS BADGE */}
      <div
        className="student-dashboard-hero"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Welcome back
          </h1>
          <p style={{ color: '#bfdbfe', fontSize: '0.95rem', marginTop: '0.35rem', margin: 0 }}>
            Welcome to Vidya Setu. All your learning material is ready for offline study.
          </p>
          <div className="learn-today-banner">
            <strong>Learn Today</strong>
            <span>Small steps build lasting progress.</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              fontWeight: 700,
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)',
              }}
            />
            <Wifi size={14} />
            {student.networkStatus}
          </span>
        </div>
      </div>

      {/* 2. IMPORTANT UPDATES SECTION */}
      <section className="student-dashboard-section student-updates-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Sparkles size={18} style={{ color: '#f59e0b' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Important Updates
          </h3>
        </div>

        <div className="student-updates-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {/* Update 1: Lecture Updated — V2 available — Needs Review */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #0284c7',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <div>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-v2">V2</span>
                <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' }}>
                  Needs Review
                </span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                Lecture Updated — V2 available — Needs Review
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                {importantUpdates[0].description}
              </p>
              <div style={{ marginTop: '0.75rem', color: '#475569', fontSize: '0.85rem' }}>
                <div><strong>Local Version:</strong> V1</div>
                <div><strong>Latest Version:</strong> V2</div>
                <div style={{ marginTop: '0.35rem' }}>Old and new content will NOT be mixed.</div>
                {latestVersion?.version === 'V2' ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ marginTop: '0.75rem' }}
                    onClick={() => onVersionUpdate?.({
                      ...activeContinueLearning,
                      version: 'V2',
                      versionId: latestVersion.versionId,
                      fileUrl: latestVersion.fileUrl,
                      fileName: latestVersion.fileName,
                      fileSize: latestVersion.fileSize,
                      verificationStatus: latestVersion.verificationStatus,
                      resourceType: 'Video',
                    })}
                  >
                    Download V2
                  </button>
                ) : (
                  <span style={{ display: 'block', marginTop: '0.75rem', color: '#64748b' }}>
                    V2 update unavailable until the latest version is provided.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Update 2: Teacher Correction — View Correction */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #d97706',
              borderRadius: '10px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <div>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                  <AlertTriangle size={12} />
                  Teacher Correction
                </span>
                <span className="badge badge-v1">V1</span>
                <span className="badge badge-verified">Verified</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                Teacher Correction — View Correction
              </h4>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
                {importantUpdates[1].description}
              </p>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <strong style={{ display: 'block', color: '#0f172a' }}>Correction Capsule</strong>
                <span style={{ display: 'block', color: '#64748b', marginTop: '0.25rem' }}>Affected timestamp: 18:42</span>
                <span style={{ display: 'block', color: '#475569', marginTop: '0.25rem' }}>
                  Use the positive sign convention when calculating the discriminant.
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ marginTop: '0.75rem' }}
                  onClick={() => setCorrectionReviewed(true)}
                  disabled={correctionReviewed}
                >
                  {correctionReviewed ? 'Reviewed' : 'Mark as Reviewed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONTINUE LEARNING CARD */}
      <section className="student-dashboard-section continue-learning-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Play size={18} style={{ color: '#2563eb' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Continue Learning
          </h3>
        </div>

        <div
          className="continue-learning-card"
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span className="card-course-tag">{activeContinueLearning.courseName}</span>
            <span className="badge badge-v1">{activeContinueLearning.version}</span>
            <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
              <ShieldCheck size={12} />
              {activeContinueLearning.status}
            </span>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0 1rem 0' }}>
            {activeContinueLearning.title}
          </h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>
              <span>Learning progress: <strong>{learningProgress}%</strong></span>
              <span>{activeContinueLearning.timestamp}</span>
            </div>
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${learningProgress}%`,
                  background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
                  borderRadius: '9999px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onResumeLecture?.(activeContinueLearning)}
            >
              <Play size={16} />
              Resume Lecture
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onPracticeQuiz?.(activeContinueLearning)}
            >
              <GraduationCap size={16} />
              Practice Quiz
            </button>
          </div>
        </div>
      </section>

      {/* 4. MY COURSES CARDS (Mathematics, Science, English) */}
      <section className="student-dashboard-section my-courses-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <BookOpen size={18} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            My Courses
          </h3>
        </div>

        <div className="student-courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {coursePreview.map((course) => {
            return (
              <div
                key={course.courseId}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                      }}
                    >
                      <BookOpen size={20} />
                    </div>
                    <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                      Available Offline
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                    {course.subjects.length} subjects
                  </span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0.15rem 0 0.35rem 0' }}>
                    {course.courseName}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4, margin: '0 0 1rem 0' }}>
                    {course.description}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.82rem',
                    color: '#64748b',
                  }}
                >
                  <span>{course.lectureCount} lectures</span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onSelectCourse?.(course.courseId)}
                  >
                    View Course <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={onViewAllCourses}>
          View All Courses <ChevronRight size={16} />
        </button>
      </section>

      {/* 5. RECENT ACTIVITY SECTION */}
      <section className="student-dashboard-section recent-activity-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Clock size={18} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Recent Activity
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recentActivity.map((act) => (
            <div
              key={act.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{act.title}</span>
                  <span className={`badge ${act.badgeClass}`}>{act.syncStatus}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.15rem 0 0 0' }}>{act.meta}</p>
              </div>

              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{act.timestamp}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StudentHome;

