import React from 'react';
import { BookOpen, GraduationCap, Clock, WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const Navbar = ({ currentView, onViewChange, pendingSyncCount = 0, onOpenSync }) => {
  return (
    <header className="navbar">
      <div className="nav-content">
        <div className="brand">
          <div className="brand-icon">
            <BookOpen size={22} />
          </div>
          <div className="brand-text">
            <h1>
              Vidya Setu
              <span className="brand-tag">
                {currentView === 'student-quiz' ? 'Student' : 'Teacher'}
              </span>
            </h1>
            <span className="brand-subtitle">Bridging Education Anywhere</span>
          </div>
        </div>

        {/* View Switcher: Teacher Portal vs Student Quiz */}
        <div className="nav-view-switcher">
          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'teacher' ? 'active' : ''}`}
            onClick={() => onViewChange && onViewChange('teacher')}
            id="nav-teacher-tab"
          >
            <BookOpen size={16} />
            Teacher Portal
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${currentView === 'student-quiz' ? 'active' : ''}`}
            onClick={() => onViewChange && onViewChange('student-quiz')}
            id="nav-quiz-tab"
          >
            <GraduationCap size={16} />
            Student Learning
            {pendingSyncCount > 0 && (
              <span className="nav-pending-dot" title={`${pendingSyncCount} pending sync`}>
                {pendingSyncCount}
              </span>
            )}
          </button>
        </div>

        <div className="nav-actions">
          {/* MicroSync Trigger Pill — STUDENT ONLY */}
          {currentView === 'student-quiz' && pendingSyncCount > 0 ? (
            <button
              type="button"
              className="btn-microsync-nav-trigger"
              onClick={onOpenSync}
              title="Click to synchronize offline learning data"
              id="nav-microsync-btn"
            >
              <span className="sync-pulse-dot" />
              <Wifi size={14} />
              <span>MicroSync</span>
              <span className="sync-badge-num">{pendingSyncCount}</span>
            </button>
          ) : null}

          {currentView === 'student-quiz' ? (
            <div className="teacher-indicator" style={{ background: '#ecfdf5', color: '#065f46' }}>
              <WifiOff size={14} />
              <span>Offline Student</span>
            </div>
          ) : (
            <div className="teacher-indicator">
              <div className="teacher-avatar">T</div>
              <span>Teacher Portal</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

