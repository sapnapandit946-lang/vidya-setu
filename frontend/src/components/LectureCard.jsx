import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Clock, Layers, ArrowUpRight } from 'lucide-react';

export const LectureCard = ({ lecture, onOpenLecture }) => {
  const latestVersion = lecture.versionDetails;
  const allVersions = lecture.allVersions || (latestVersion ? [latestVersion] : []);
  const currentVer = lecture.currentVersion || 'V1';

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="lecture-card">
      <div>
        <div className="lecture-card-header">
          <span className="card-course-tag">{lecture.courseId}</span>
          <div className="lecture-badges">
            <span className={`badge ${currentVer === 'V2' ? 'badge-v2' : 'badge-v1'}`}>
              <Sparkles size={12} />
              {currentVer}
            </span>
            <span className="badge badge-published">
              <CheckCircle2 size={12} />
              Published
            </span>
            <span className="badge badge-verified">
              <ShieldCheck size={12} />
              Verified
            </span>
          </div>
        </div>

        <h4 className="lecture-card-title">{lecture.title}</h4>
        <div className="lecture-card-subject">Subject: {lecture.subject}</div>

        <p className="lecture-card-desc">
          {lecture.description || 'No description provided.'}
        </p>

        {/* Version History Summary Tag if multiple versions exist */}
        {allVersions.length > 1 && (
          <div style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#0369a1' }}>
            <Layers size={14} />
            <strong>Version History:</strong> V2 (Current) + V1 (Preserved)
          </div>
        )}
      </div>

      <div>
        {latestVersion && (
          <div className="lecture-meta-box">
            <div className="meta-row">
              <span>Current File:</span>
              <strong title={latestVersion.fileName}>
                {latestVersion.fileName.length > 22
                  ? latestVersion.fileName.substring(0, 20) + '...'
                  : latestVersion.fileName}
              </strong>
            </div>
            <div className="meta-row">
              <span>Size:</span>
              <span>{formatFileSize(latestVersion.fileSize)}</span>
            </div>
            <div className="meta-row">
              <span>Hash (SHA-256):</span>
              <span className="mono" title={latestVersion.fileHash}>
                {latestVersion.fileHash ? latestVersion.fileHash.substring(0, 10) + '...' : 'N/A'}
              </span>
            </div>
            <div className="meta-row">
              <span>Active Version ID:</span>
              <span className="mono" title={latestVersion.versionId}>
                {latestVersion.versionId.length > 18
                  ? latestVersion.versionId.substring(0, 16) + '...'
                  : latestVersion.versionId}
              </span>
            </div>
          </div>
        )}

        <div className="lecture-card-btn-row">
          <button
            type="button"
            className="btn btn-outline"
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem' }}
            onClick={() => onOpenLecture && onOpenLecture(lecture)}
          >
            Open & Update Lecture
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="lecture-card-footer" style={{ marginTop: '0.75rem' }}>
          <span className="mono">ID: {lecture.lectureId}</span>
          <span>
            <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
            {formatDate(lecture.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

