import React, { useEffect, useState } from 'react';
import LectureDownloadPanel from './LectureDownloadPanel.jsx';
import { getLectureDownloadStates } from '../utils/indexedDB.js';

export const StudentDownloads = ({ teacherLectures = [], onWatchOffline }) => {
  const [downloadLectures, setDownloadLectures] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadDownloadStates = async () => {
      const stateGroups = await Promise.all(
        teacherLectures
          .filter((teacherLecture) => teacherLecture.lectureId)
          .map(async (teacherLecture) => ({
            teacherLecture,
            states: await getLectureDownloadStates(teacherLecture.lectureId),
          }))
      );

      const records = stateGroups.flatMap(({ teacherLecture, states }) => states
        .map((downloadState) => {
          const versionDetails = (teacherLecture.allVersions || [])
            .find((version) => version.versionId === downloadState.versionId)
            || (teacherLecture.versionDetails?.versionId === downloadState.versionId
              ? teacherLecture.versionDetails
              : null);
          if (!versionDetails?.versionId || !versionDetails.fileSize || !versionDetails.fileHash) return null;
          const verificationStatus = String(
            downloadState.verificationStatus || versionDetails.verificationStatus || 'pending'
          ).toLowerCase();

          return {
            ...teacherLecture,
            ...versionDetails,
            ...downloadState,
            version: teacherLecture.currentVersion || 'V1',
            verificationStatus,
          };
        })
        .filter(Boolean));

      if (!cancelled) setDownloadLectures(records);
    };

    loadDownloadStates().catch(() => {
      if (!cancelled) setDownloadLectures([]);
    });
    const refreshTimer = window.setInterval(loadDownloadStates, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [teacherLectures]);

  const isVerifiedComplete = (item) => (
    item.downloadStatus === 'completed' && item.verificationStatus === 'verified'
  );
  const inProgressLectures = downloadLectures.filter((item) => !isVerifiedComplete(item));
  const completedLectures = downloadLectures.filter(isVerifiedComplete);

  const renderDownloadPanel = (downloadLecture) => (
    <div key={`${downloadLecture.lectureId}:${downloadLecture.versionId}`} style={{ marginBottom: '1rem' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <h4 style={{ margin: 0 }}>{downloadLecture.title}</h4>
        <p style={{ color: '#64748b', margin: '0.35rem 0' }}>{downloadLecture.subjectName || downloadLecture.subject}</p>
        <span className="mono" style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Lecture: {downloadLecture.lectureId} | Version: {downloadLecture.versionId}
        </span>
      </div>
      <LectureDownloadPanel lecture={downloadLecture} onWatchOffline={onWatchOffline} />
    </div>
  );

  return (
  <div style={{ maxWidth: '960px', margin: '0 auto' }}>
    <div style={{ marginBottom: '1.5rem' }}>
      <div>
        <h2>Downloads</h2>
        <p style={{ color: '#64748b' }}>Manage offline lecture packages.</p>
      </div>
    </div>

    <section style={{ marginBottom: '2rem' }}>
      <h3>In Progress</h3>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', background: '#ffffff' }}>
        {inProgressLectures.length > 0
          ? inProgressLectures.map(renderDownloadPanel)
          : <p style={{ color: '#64748b' }}>Choose a lecture from Courses to start an offline download.</p>}
      </div>
    </section>

    <section>
      <h3>Downloaded</h3>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', background: '#ffffff' }}>
        {completedLectures.length > 0
          ? completedLectures.map(renderDownloadPanel)
          : <p style={{ color: '#64748b' }}>Completed downloads will appear here.</p>}
      </div>
    </section>
  </div>
  );
};

export default StudentDownloads;
