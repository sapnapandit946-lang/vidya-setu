import React, { useEffect, useState } from 'react';
import { CURRICULUM_DATA } from '../data/curriculumData.js';
import {
  BookOpen,
  Download,
  ChevronRight,
  GraduationCap,
  Layers,
  FileText,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Wifi,
} from 'lucide-react';

export const StudentCourseBrowser = ({
  onSelectLecture,
  teacherLectures = [],
  pendingSyncCount = 0,
  onOpenSync,
}) => {
  // Navigation State: 'courses' | 'subjects' | 'lectures'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Single Source of Truth: Group teacher-published lectures directly into Courses -> Subjects -> Lectures
  let enrichedCourses = [];

  if (teacherLectures && teacherLectures.length > 0) {
    const courseMap = {};

    teacherLectures.forEach((lec) => {
      const courseId = lec.courseId || 'General';
      // Nicely format course name if it's like CS101 or MATH101
      const courseName = courseId === 'CS101'
        ? 'CS101: Computer Science'
        : courseId === 'MATH101'
        ? 'MATH101: Mathematics'
        : courseId === 'PHYS101'
        ? 'PHYS101: Physics'
        : courseId;

      if (!courseMap[courseId]) {
        courseMap[courseId] = {
          courseId,
          courseName,
          description: `Master curriculum module for ${courseName}, published directly by the Teacher Portal.`,
          subjectsMap: {},
        };
      }

      const subjectName = lec.subject || 'General Studies';
      const subjectId = `subj_${subjectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      if (!courseMap[courseId].subjectsMap[subjectName]) {
        courseMap[courseId].subjectsMap[subjectName] = {
          subjectId,
          subjectName,
          description: `Subject module: ${subjectName}`,
          lectures: [],
        };
      }

      courseMap[courseId].subjectsMap[subjectName].lectures.push({
        ...lec,
        lectureId: lec.lectureId,
        title: lec.title,
        description: lec.description || 'Master lecture content.',
        duration: '35 mins',
        currentVersion: lec.currentVersion || 'V1',
        version: lec.currentVersion || 'V1',
        versionId: lec.versionDetails?.versionId || lec.versionId || `${lec.lectureId}_${(lec.currentVersion || 'V1').toLowerCase()}`,
        subject: lec.subject,
        fileName: lec.versionDetails?.fileName || lec.fileName,
        fileUrl: lec.versionDetails?.fileUrl || lec.fileUrl,
        fileSize: lec.versionDetails?.fileSize || lec.fileSize,
        fileHash: lec.versionDetails?.fileHash || lec.fileHash,
        verificationStatus: lec.versionDetails?.verificationStatus || 'Verified',
        resourceType: getResourceType({ ...lec, ...(lec.versionDetails || {}) }),
      });
    });

    enrichedCourses = Object.values(courseMap).map((c) => ({
      courseId: c.courseId,
      courseName: c.courseName,
      description: c.description,
      subjects: Object.values(c.subjectsMap),
    }));
  } else {
    // If no lectures have been published yet by teacher, fallback cleanly to base curriculum
    enrichedCourses = [...CURRICULUM_DATA];
  }

    useEffect(() => {
      if (initialCourseId) {
        setSelectedCourse(enrichedCourses.find((course) => course.courseId === initialCourseId) || null);
        setSelectedSubject(null);
      }
    }, [initialCourseId]);

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

      {/* Student MicroSync Quick Access Banner */}
      {pendingSyncCount > 0 && onOpenSync && (
        <div className="student-microsync-callout">
          <div className="microsync-callout-left">
            <div className="microsync-callout-icon">
              <Wifi size={18} />
            </div>
            <div>
              <div className="microsync-callout-title">MicroSync Ready ({pendingSyncCount} pending)</div>
              <div className="microsync-callout-sub">
                You have offline quizzes or doubts saved locally. Synchronize whenever connection is detected.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm btn-microsync-open"
            onClick={onOpenSync}
          >
            Open MicroSync
          </button>
        </div>
      )}

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
                      <span className={`badge ${(lec.currentVersion || lec.version) === 'V2' ? 'badge-v2' : 'badge-v1'}`}>
                        <Sparkles size={12} />
                        {lec.currentVersion || lec.version || 'V1'}
                      </span>
                      <span className="badge badge-published">Published</span>
                      <span className="badge badge-verified">Verified</span>
                      {(lec.versionDetails?.correctionDetails?.hasCorrection || (lec.currentVersion === 'V2' && lec.versionDetails?.correctionDetails?.note)) && (
                        <span className="badge badge-correction" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', gap: '0.25rem' }}>
                          ⚡ Correction Available
                        </span>
                      )}
                    </div>
                    <p className="lecture-row-desc">{lec.description}</p>
                    {lec.versionDetails?.correctionDetails?.note && (
                      <div style={{ fontSize: '0.78rem', color: '#0369a1', margin: '0.2rem 0 0.35rem', fontWeight: 500 }}>
                        <strong>V1 → V2 Note:</strong> {lec.versionDetails.correctionDetails.note}
                        {lec.versionDetails.correctionDetails.timestamp ? ` (at ${lec.versionDetails.correctionDetails.timestamp})` : ''}
                      </div>
                    )}
                    <span className="mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      ID: {lec.lectureId}
                    </span>
                    {formatFileSize(lec.fileSize) && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.5rem' }}>
                        {formatFileSize(lec.fileSize)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="lecture-row-right">
                  {(lec.versionDetails?.correctionDetails?.hasCorrection || (lec.currentVersion === 'V2' && lec.versionDetails?.correctionDetails?.note)) && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ borderColor: '#f59e0b', color: '#b45309', background: '#fffbeb' }}
                      onClick={() =>
                        onSelectLecture({
                          ...lec,
                          courseName: selectedCourse.courseName,
                          subjectName: selectedSubject.subjectName,
                          action: 'watch',
                          initialTimestamp: lec.versionDetails?.correctionDetails?.timestamp || '',
                          reviewCorrection: true,
                        })
                      }
                      id={`review-correction-${lec.lectureId}`}
                      title="Review correction capsule and open video at correction timestamp"
                    >
                      <Sparkles size={15} color="#d97706" />
                      Review Correction
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() =>
                      onSelectLecture({
                        ...lec,
                        courseName: selectedCourse.courseName,
                        subjectName: selectedSubject.subjectName,
                        action: lec.resourceType === 'Quiz'
                          ? 'quiz'
                          : lec.resourceType === 'Video' ? 'watch' : 'open-resource',
                      })
                    }
                    id={`watch-lecture-${lec.lectureId}`}
                    title="Watch offline video and ask timestamped doubts"
                  >
                    <BookOpen size={15} />
                    {lec.resourceType === 'Quiz' ? 'Practice Quiz' : lec.resourceType === 'PDF' ? 'Open PDF' : lec.resourceType === 'Presentation' ? 'Open Presentation' : lec.resourceType === 'Audio' ? 'Listen' : 'Watch Lecture'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() =>
                      onDownloadLecture?.({
                        ...lec,
                        courseName: selectedCourse.courseName,
                        subjectName: selectedSubject.subjectName,
                        action: 'download',
                      })
                    }
                    id={`download-lecture-${lec.lectureId}`}
                    title="Download this lecture for offline study"
                  >
                    <Download size={15} />
                    Download for Offline
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

                {lec.lectureId && lec.versionId && lec.fileSize && lec.fileHash && (
                  <LectureDownloadPanel lecture={lec} />
                )}

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
