import React, { useState, useRef } from 'react';
import { getQuizForLecture } from '../data/curriculumData.js';
import {
  X,
  UploadCloud,
  File,
  Trash2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  History,
  Info,
  Check,
} from 'lucide-react';

export const LectureDetailsModal = ({ isOpen, onClose, lecture, onUpdatedSuccess }) => {
  // Steps: 'details' | 'edit' | 'review' | 'success'
  const [step, setStep] = useState('details');

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    correctionNote: '',
    correctionTimestamp: '',
    correctionSummary: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [publishedData, setPublishedData] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize or reset form data when lecture changes or modal opens
  React.useEffect(() => {
    if (lecture) {
      setFormData({
        title: lecture.title || '',
        subject: lecture.subject || '',
        description: lecture.description || '',
        correctionNote: '',
        correctionTimestamp: '',
        correctionSummary: '',
      });
      setSelectedFile(null);
      setErrorMessage('');
      setStep('details');
      setPublishedData(null);
    }
  }, [lecture, isOpen]);

  if (!isOpen || !lecture) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMessage('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleProceedToReview = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim()) {
      setErrorMessage('Lecture title is required.');
      return;
    }
    if (!formData.subject.trim()) {
      setErrorMessage('Subject is required.');
      return;
    }
    if (!selectedFile) {
      setErrorMessage('Please attach updated lecture content or a sample file for V2.');
      return;
    }

    setStep('review');
  };

  const handlePublishV2 = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = new FormData();
      payload.append('file', selectedFile);
      payload.append('versionNumber', 'V2');
      payload.append('title', formData.title.trim());
      payload.append('subject', formData.subject.trim());
      payload.append('description', formData.description.trim());
      if (formData.correctionNote.trim()) {
        payload.append('correctionNote', formData.correctionNote.trim());
      }
      if (formData.correctionTimestamp.trim()) {
        payload.append('correctionTimestamp', formData.correctionTimestamp.trim());
      }
      if (formData.correctionSummary.trim()) {
        payload.append('correctionSummary', formData.correctionSummary.trim());
      }
      payload.append('previousVersion', 'V1');

      // Ensure V2 update has lecture-specific quiz questions attached
      const v2Quiz = getQuizForLecture({
        ...lecture,
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        description: formData.description.trim(),
      });
      if (v2Quiz) {
        payload.append('quiz', JSON.stringify(v2Quiz));
      }

      const res = await fetch(`/api/lectures/${lecture.lectureId}/versions`, {
        method: 'POST',
        body: payload,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to publish lecture version V2.');
      }

      setPublishedData(data);
      setStep('success');

      if (onUpdatedSuccess) {
        onUpdatedSuccess(data);
      }
    } catch (err) {
      console.error('Error publishing V2:', err);
      setErrorMessage(err.message || 'Failed to publish V2 update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('details');
    setSelectedFile(null);
    setErrorMessage('');
    onClose();
  };

  const versionsList = lecture.allVersions || (lecture.versionDetails ? [lecture.versionDetails] : []);
  const currentVersionTag = lecture.currentVersion || 'V1';

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {step === 'details' && 'Lecture Details & Versions'}
            {step === 'edit' && 'Update Lecture (Create V2)'}
            {step === 'review' && 'Review Version V2'}
            {step === 'success' && 'V2 Published Successfully'}
          </h3>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: LECTURE DETAILS VIEW */}
        {step === 'details' && (
          <div className="modal-body">
            <div style={{ marginBottom: '1.25rem' }}>
              <span className="card-course-tag">{lecture.courseId}</span>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0.4rem 0 0.2rem', color: '#0f172a' }}>
                {lecture.title}
              </h2>
              <div style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
                Subject: {lecture.subject}
              </div>
              <p style={{ color: '#64748b', fontSize: '0.925rem', marginTop: '0.5rem' }}>
                {lecture.description || 'No description provided.'}
              </p>
            </div>

            <div className="success-summary-box" style={{ margin: '1rem 0' }}>
              <div className="success-summary-row">
                <span className="summary-label">Current Version:</span>
                <span className={`badge ${currentVersionTag === 'V2' ? 'badge-v2' : 'badge-v1'}`}>
                  <Sparkles size={12} />
                  {currentVersionTag}
                </span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">Status:</span>
                <span className="badge badge-published">
                  <CheckCircle2 size={12} />
                  Published
                </span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">Verification:</span>
                <span className="badge badge-verified">
                  <ShieldCheck size={12} />
                  Verified
                </span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">Lecture ID:</span>
                <span className="summary-val mono">{lecture.lectureId}</span>
              </div>
            </div>

            {/* Version History Tree */}
            <div className="version-history-box">
              <div className="version-history-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <History size={16} /> Version History
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {versionsList.length} version{versionsList.length !== 1 ? 's' : ''} stored
                </span>
              </div>

              <div className="version-tree">
                {versionsList.map((ver, idx) => {
                  const isCurrent = ver.isActive || idx === 0;
                  const verName = idx === 0 && currentVersionTag === 'V2' ? 'V2' : 'V1';
                  return (
                    <div
                      key={ver.versionId || idx}
                      className={`version-item ${isCurrent ? 'current' : 'previous'}`}
                    >
                      <div className="version-item-left">
                        <span className={`badge ${verName === 'V2' ? 'badge-v2' : 'badge-v1'}`}>
                          {verName}
                        </span>
                        <div>
                          <div className="version-title-tag">
                            {verName} — {isCurrent ? 'Current Version' : 'Previous Version'}
                          </div>
                          <div className="version-subtext mono">
                            ID: {ver.versionId} • Hash: {ver.fileHash?.substring(0, 10)}...
                          </div>
                          {ver.correctionDetails?.hasCorrection && (
                            <div style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: '#0369a1' }}>
                              ⚡ <strong>Correction:</strong> {ver.correctionDetails.note || 'Updated content'}
                              {ver.correctionDetails.timestamp ? ` (at ${ver.correctionDetails.timestamp})` : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <span className="badge badge-published">Published</span>
                        <span className="badge badge-verified">Verified</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
              <button type="button" className="btn btn-outline" onClick={handleClose}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep('edit')}
                id="update-lecture-btn"
              >
                <Sparkles size={16} />
                Update Lecture
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: UPDATE LECTURE FORM */}
        {step === 'edit' && (
          <form onSubmit={handleProceedToReview}>
            <div className="modal-body">
              {errorMessage && (
                <div className="error-banner">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Preservation Notice Box */}
              <div className="info-callout">
                <strong>Important Version Information</strong>
                Your existing <strong>V1</strong> will be preserved. This update will be published as a completely separate <strong>V2</strong> with its own file hash and version ID.
              </div>

              <div className="form-group">
                <label className="form-label">New Version</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="badge badge-v2" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                    <Sparkles size={14} />
                    V2
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    (Incrementing from current {currentVersionTag})
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-title">
                  Lecture Title <span className="required">*</span>
                </label>
                <input
                  id="edit-title"
                  name="title"
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-subject">
                  Subject <span className="required">*</span>
                </label>
                <input
                  id="edit-subject"
                  name="subject"
                  type="text"
                  className="form-input"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-description">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>

              {/* Correction Capsule Settings (V1 -> V2) */}
              <div className="correction-capsule-card" style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={16} color="#0284c7" />
                  <strong style={{ fontSize: '0.925rem', color: '#0f172a' }}>
                    Correction Capsule (V1 → V2)
                  </strong>
                  <span className="badge badge-v2" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                    Correction Note
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" htmlFor="edit-correction-note" style={{ fontSize: '0.82rem' }}>
                    What was corrected / updated?
                  </label>
                  <input
                    id="edit-correction-note"
                    name="correctionNote"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Corrected quadratic formula root derivation and signs"
                    value={formData.correctionNote}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" htmlFor="edit-correction-timestamp" style={{ fontSize: '0.82rem' }}>
                      Correction Timestamp (Optional)
                    </label>
                    <input
                      id="edit-correction-timestamp"
                      name="correctionTimestamp"
                      type="text"
                      className="form-input mono"
                      placeholder="e.g. 18:42 or 05:30"
                      value={formData.correctionTimestamp}
                      onChange={handleInputChange}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Jumps student player directly to this moment.
                    </span>
                  </div>

                  <div>
                    <label className="form-label" htmlFor="edit-correction-summary" style={{ fontSize: '0.82rem' }}>
                      Summary Note (Optional)
                    </label>
                    <input
                      id="edit-correction-summary"
                      name="correctionSummary"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Fixes sign error in Step 3"
                      value={formData.correctionSummary}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Lecture Content / Replacement File <span className="required">*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {!selectedFile ? (
                  <div
                    className="file-dropzone"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <div className="dropzone-icon">
                      <UploadCloud size={24} />
                    </div>
                    <div className="dropzone-text">Click to upload replacement/updated file for V2</div>
                    <div className="dropzone-hint">Upload new lecture video, audio, slides or notes</div>
                  </div>
                ) : (
                  <div className="selected-file-preview">
                    <div className="file-info">
                      <File size={20} className="file-info-icon" />
                      <div>
                        <div className="file-name">{selectedFile.name}</div>
                        <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => setSelectedFile(null)}
                      title="Remove file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStep('details')}
              >
                Back to Lecture
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                id="review-v2-btn"
              >
                Review V2
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: REVIEW V2 SCREEN */}
        {step === 'review' && (
          <div className="modal-body">
            {errorMessage && (
              <div className="error-banner">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                Review Lecture Update: V2
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Verify that your changes are ready for publication.
              </p>
            </div>

            <div className="info-callout" style={{ borderLeftColor: '#059669', background: '#ecfdf5', color: '#065f46' }}>
              <strong>Preservation Guarantee</strong>
              V1 will remain unchanged. V2 will be stored separately.
            </div>

            <div className="success-summary-box">
              <div className="success-summary-row">
                <span className="summary-label">Lecture:</span>
                <span className="summary-val">{formData.title}</span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">Previous Version:</span>
                <span className="badge badge-v1">
                  <Sparkles size={12} />
                  V1
                </span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">New Version:</span>
                <span className="badge badge-v2">
                  <Sparkles size={12} />
                  V2
                </span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">New File Attached:</span>
                <span className="summary-val">{selectedFile?.name} ({formatFileSize(selectedFile?.size)})</span>
              </div>
              {formData.correctionNote && (
                <div className="success-summary-row">
                  <span className="summary-label">Correction Capsule:</span>
                  <span className="summary-val" style={{ color: '#0369a1', fontWeight: 600 }}>
                    "{formData.correctionNote}"
                    {formData.correctionTimestamp ? ` (at ${formData.correctionTimestamp})` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Checklist items requested in prompt */}
            <div className="review-checklist">
              <div className="review-check-item">
                <Check size={16} /> Existing V1 preserved
              </div>
              <div className="review-check-item">
                <Check size={16} /> New V2 created
              </div>
              <div className="review-check-item">
                <Check size={16} /> New version content attached
              </div>
              <div className="review-check-item">
                <Check size={16} /> Ready to publish
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '1rem 0 0', border: 'none', background: 'transparent' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStep('edit')}
                disabled={isSubmitting}
              >
                Back to Edit
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePublishV2}
                disabled={isSubmitting}
                id="publish-v2-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Publishing V2...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Publish V2
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS VIEW */}
        {step === 'success' && publishedData && (
          <div className="modal-body success-screen">
            <div className="success-badge-icon">
              <CheckCircle2 size={36} />
            </div>
            <h3>✓ Lecture V2 Published Successfully</h3>
            <p className="success-subtitle">
              Version V2 is now the active verified version, while V1 remains preserved.
            </p>

            <div className="success-summary-box">
              <div className="success-summary-row">
                <span className="summary-label">Lecture Title:</span>
                <span className="summary-val">{publishedData.lecture.title}</span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">Current Version:</span>
                <span className="badge badge-v2">
                  <Sparkles size={12} />
                  V2
                </span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">Status:</span>
                <span className="badge badge-published">
                  <CheckCircle2 size={12} />
                  Published
                </span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">Verification:</span>
                <span className="badge badge-verified">
                  <ShieldCheck size={12} />
                  Verified
                </span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">Lecture ID:</span>
                <span className="summary-val mono">{publishedData.lecture.lectureId}</span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">V2 Version ID:</span>
                <span className="summary-val mono">{publishedData.version.versionId}</span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">V2 File Hash:</span>
                <span className="summary-val mono" style={{ fontSize: '0.78rem' }}>
                  {publishedData.version.fileHash}
                </span>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleClose}>
              View in Teacher Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
