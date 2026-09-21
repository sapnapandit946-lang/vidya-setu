import React, { useState } from 'react';
import { CURRICULUM_DATA } from '../data/curriculumData.js';
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Layers,
  FileText,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const StudentCourseBrowser = ({ onSelectLecture, teacherLectures = [] }) => {
  // Navigation State: 'courses' | 'subjects' | 'lectures'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Combine static curriculum courses with teacher-published lectures from Parts 1 & 2
  const enrichedCourses = [...CURRICULUM_DATA];

  // If there are teacher lectures not in default curriculum, group them into a dynamic course
  if (teacherLectures && teacherLectures.length > 0) {
    const publishedCourse = {
      courseId: 'published_courses',
      courseName: 'Teacher Published Lectures',
      description: 'Lectures verified and published from the Teacher Portal (V1 & V2).',
      icon: 'BookOpen',
      subjects: [],
    };

    // Group by subject
    const subjectMap = {};
    teacherLectures.forEach((lec) => {
      const subj = lec.subject || 'General Studies';
      if (!subjectMap[subj]) {
        subjectMap[subj] = {
          subjectId: `subj_${subj.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          subjectName: subj,
          description: `Teacher course module: ${subj}`,
          lectures: [],
        };
      }
      subjectMap[subj].lectures.push({
        lectureId: lec.lectureId,
        title: lec.title,
        description: lec.description || 'Master lecture content.',
        duration: '35 mins',
        version: lec.currentVersion || 'V1',
      });
    });

    publishedCourse.subjects = Object.values(subjectMap);
    enrichedCourses.push(publishedCourse);
  }

  // Handle Breadcrumb navigation
  const handleResetToCourses = () => {
    setSelectedCourse(null);
    setSelectedSubject(null);
  };

  const handleResetToSubjects = () => {
    setSelectedSubject(null);
  };

  return (
    <div className="course-browser-container">
      {/* Breadcrumb Bar */}
      <div className="browser-breadcrumb">
        <button
          type="button"
          className={`breadcrumb-link ${!selectedCourse ? 'active' : ''}`}
          onClick={handleResetToCourses}
        >
          Courses
        </button>

        {selectedCourse && (
          <>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <button
              type="button"
              className={`breadcrumb-link ${!selectedSubject ? 'active' : ''}`}
              onClick={handleResetToSubjects}
            >
              {selectedCourse.courseName}
            </button>
          </>
        )}

        {selectedSubject && (
          <>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <span className="breadcrumb-current">{selectedSubject.subjectName}</span>
          </>
        )}
      </div>

      {/* STEP 1: SELECT COURSE */}
      {!selectedCourse && (
        <div>
          <div className="browser-heading">
            <h2>Select Course</h2>
            <p>Browse available offline curriculum and student practice packages.</p>
          </div>

          <div className="hierarchy-grid">
            {enrichedCourses.map((course) => (
              <div
                key={course.courseId}
                className="hierarchy-card course-card"
                onClick={() => setSelectedCourse(course)}
              >
                <div className="hierarchy-card-header">
                  <div className="hierarchy-icon-box blue">
                    <BookOpen size={24} />
                  </div>
                  <span className="badge badge-published">
                    {course.subjects.length} Subjects
                  </span>
                </div>

                <h3 className="hierarchy-card-title">{course.courseName}</h3>
                <p className="hierarchy-card-desc">{course.description}</p>

                <div className="hierarchy-card-action">
                  <span>Browse Subjects</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT SUBJECT */}
      {selectedCourse && !selectedSubject && (
        <div>
          <div className="browser-heading">
            <button type="button" className="btn-back-link" onClick={handleResetToCourses}>
              <ArrowLeft size={16} /> All Courses
            </button>
            <h2>{selectedCourse.courseName}</h2>
            <p>Select a subject topic to see individual lectures and practice quizzes.</p>
          </div>

          <div className="hierarchy-grid">
            {selectedCourse.subjects.map((subject) => (
              <div
                key={subject.subjectId}
                className="hierarchy-card subject-card"
                onClick={() => setSelectedSubject(subject)}
              >
                <div className="hierarchy-card-header">
                  <div className="hierarchy-icon-box purple">
                    <Layers size={22} />
                  </div>
                  <span className="badge badge-published">
                    {subject.lectures.length} Lectures
                  </span>
                </div>

                <h3 className="hierarchy-card-title">{subject.subjectName}</h3>
                <p className="hierarchy-card-desc">{subject.description}</p>

                <div className="hierarchy-card-action">
                  <span>View Lectures</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: SELECT LECTURE & TAKE QUIZ */}
      {selectedCourse && selectedSubject && (
        <div>
          <div className="browser-heading">
            <button type="button" className="btn-back-link" onClick={handleResetToSubjects}>
              <ArrowLeft size={16} /> {selectedCourse.courseName}
            </button>
            <h2>{selectedSubject.subjectName}</h2>
            <p>Select a lecture to view its details and take its dedicated offline practice quiz.</p>
          </div>

          <div className="lectures-list-container">
            {selectedSubject.lectures.map((lec, idx) => (
              <div key={lec.lectureId} className="lecture-row-card">
                <div className="lecture-row-left">
                  <div className="lecture-number-badge">{idx + 1}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <h4 className="lecture-row-title">{lec.title}</h4>
                      <span className="badge badge-v1">{lec.version || 'V1'}</span>
                      <span className="badge badge-verified">Verified</span>
                    </div>
                    <p className="lecture-row-desc">{lec.description}</p>
                    <span className="mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      ID: {lec.lectureId}
                    </span>
                  </div>
                </div>

                <div className="lecture-row-right">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() =>
                      onSelectLecture({
                        ...lec,
                        courseName: selectedCourse.courseName,
                        subjectName: selectedSubject.subjectName,
                        action: 'watch',
                      })
                    }
                    id={`watch-lecture-${lec.lectureId}`}
                    title="Watch offline video and ask timestamped doubts"
                  >
                    <BookOpen size={15} />
                    Watch Lecture
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      onSelectLecture({
                        ...lec,
                        courseName: selectedCourse.courseName,
                        subjectName: selectedSubject.subjectName,
                        action: 'quiz',
                      })
                    }
                    id={`take-quiz-${lec.lectureId}`}
                  >
                    <GraduationCap size={16} />
                    Practice Quiz
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
