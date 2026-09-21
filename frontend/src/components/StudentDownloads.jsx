import React from 'react';
import { CheckCircle2, Download, Pause, Play } from 'lucide-react';

const formatMegabytes = (bytes) => Math.round(bytes / (1024 * 1024));
const resourceActionLabel = (resourceType) => {
  if (resourceType === 'PDF') return 'Open PDF';
  if (resourceType === 'Presentation') return 'Open Presentation';
  if (resourceType === 'Audio') return 'Listen';
  return 'Open / Watch';
};

export const StudentDownloads = ({ lecture, onOpenLecture, onOpenResource, onStartDownload }) => {
  const selectedLecture = lecture
    ? {
        ...lecture,
        version: lecture.version || 'V1',
        versionId: lecture.versionId || `${lecture.lectureId}_${(lecture.version || 'V1').toLowerCase()}`,
        verificationStatus: lecture.verificationStatus || 'Verified',
      }
    : null;
  const isComplete = selectedLecture?.downloadStatus === 'completed' || selectedLecture?.downloadProgress === 100;
  const hasProgress = Number.isFinite(selectedLecture?.downloadProgress);
  const fileSizeLabel = selectedLecture?.fileSize
    ? `${formatMegabytes(selectedLecture.fileSize)} MB`
    : 'Size unavailable';

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
        {!isComplete && selectedLecture ? <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ margin: 0 }}>{selectedLecture.title}</h4>
            <p style={{ color: '#64748b', margin: '0.35rem 0' }}>{selectedLecture.subjectName || selectedLecture.subject}</p>
            <span className={`badge ${selectedLecture.version === 'V2' ? 'badge-v2' : 'badge-v1'}`}>{selectedLecture.version}</span>
            <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>{fileSizeLabel}</span>
          </div>
          <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>
            <Pause size={13} /> {selectedLecture.downloadStatus || 'Download Paused'}
          </span>
        </div> : null}

        {!isComplete && selectedLecture && <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.85rem' }}>
            <span>{hasProgress && selectedLecture.downloadedBytes != null && selectedLecture.totalBytes != null
              ? `${formatMegabytes(selectedLecture.downloadedBytes)} MB of ${formatMegabytes(selectedLecture.totalBytes)} MB`
              : 'Progress waiting for download engine'}</span>
            {hasProgress && <strong>{selectedLecture.downloadProgress}%</strong>}
          </div>
          {hasProgress && <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '9999px', marginTop: '0.4rem', overflow: 'hidden' }}>
            <div style={{ width: `${selectedLecture.downloadProgress}%`, height: '100%', background: '#2563eb' }} />
          </div>}
        </div>}

        {!isComplete && selectedLecture && selectedLecture.checkpoint && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: '#166534' }}>
          <CheckCircle2 size={16} /> {selectedLecture.checkpoint}
        </div>}
        {!isComplete && selectedLecture && <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => onStartDownload?.(selectedLecture)}
        >
          <Download size={16} /> Resume Download
        </button>}
        {!selectedLecture && <p style={{ color: '#64748b' }}>Choose a lecture from Courses to start an offline download.</p>}
          
      </div>
    </section>

    <section>
      <h3>Downloaded</h3>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', background: '#ffffff' }}>
        {isComplete && <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h4 style={{ margin: 0 }}>{selectedLecture.title}</h4>
            <p style={{ color: '#64748b', margin: '0.35rem 0' }}>{selectedLecture.subjectName || selectedLecture.subject}</p>
            <span className={`badge ${selectedLecture.version === 'V2' ? 'badge-v2' : 'badge-v1'}`}>{selectedLecture.version}</span>
            <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>{fileSizeLabel}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-verified"><CheckCircle2 size={13} /> {selectedLecture.verificationStatus}</span>
            <span className="badge" style={{ background: '#ecfdf5', color: '#065f46' }}>Available Offline</span>
          </div>
        </div>}
        {isComplete && <button type="button" className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => {
          if (selectedLecture.resourceType === 'Video') onOpenLecture(selectedLecture);
          else onOpenResource?.({ ...selectedLecture, action: 'open-resource' });
        }}>
          <Play size={16} /> {resourceActionLabel(selectedLecture.resourceType)}
        </button>}
        {!isComplete && <p style={{ color: '#64748b' }}>Completed downloads will appear here.</p>}
      </div>
    </section>
  </div>
  );
};

export default StudentDownloads;
