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
} from 'lucide-react';

const createEmptyQuestion = () => ({
  questionId: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  text: '',
  options: [
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' },
  ],
  correctAnswer: 'A',
});

export const CreateLectureModal = ({ isOpen, onClose, onPublishedSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    subject: '',
    description: '',
    lectureId: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [publishedData, setPublishedData] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

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

  const updateQuizQuestion = (questionIndex, field, value) => {
    setQuizQuestions((questions) => questions.map((question, index) => (
      index === questionIndex ? { ...question, [field]: value } : question
    )));
  };

  const updateQuizOption = (questionIndex, optionKey, value) => {
    setQuizQuestions((questions) => questions.map((question, index) => (
      index === questionIndex
        ? { ...question, options: question.options.map((option) => option.key === optionKey ? { ...option, text: value } : option) }
        : question
    )));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Form validations
    if (!formData.title.trim()) {
      setErrorMessage('Lecture title is required.');
      return;
    }
    if (!formData.courseId.trim()) {
      setErrorMessage('Course ID is required.');
      return;
    }
    if (!formData.subject.trim()) {
      setErrorMessage('Subject is required.');
      return;
    }
    if (!selectedFile) {
      setErrorMessage('Please upload a sample lecture file to publish V1.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate lecture-specific quiz associated directly with this lecture
      const draftLectureId = formData.lectureId.trim() || `lec_${Date.now().toString(36)}`;
      const generatedQuiz = getQuizForLecture({
        lectureId: draftLectureId,
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        courseId: formData.courseId.trim(),
        description: formData.description.trim(),
      });
      const quiz = quizQuestions.length > 0
        ? { quizId: generatedQuiz.quizId, title: generatedQuiz.title, questions: quizQuestions }
        : generatedQuiz;

      // Step 1 & 2: Create lecture record with explicit lecture-specific quiz
      const createRes = await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          courseId: formData.courseId.trim(),
          subject: formData.subject.trim(),
          description: formData.description.trim(),
          lectureId: formData.lectureId.trim() || undefined,
          quiz,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.message || 'Failed to create lecture record.');
      }

      const createdLecture = createData.lecture;
      const lectureId = createdLecture.lectureId;

      // Step 3-8: Upload sample lecture file and Publish V1
      const versionPayload = new FormData();
      versionPayload.append('file', selectedFile);

      const publishRes = await fetch(`/api/lectures/${lectureId}/versions`, {
        method: 'POST',
        body: versionPayload,
      });

      const publishData = await publishRes.json();
      if (!publishRes.ok || !publishData.success) {
        throw new Error(publishData.message || 'Failed to publish lecture version V1.');
      }

      // Step 9: Show success screen
      const result = {
        lecture: publishData.lecture,
        version: publishData.version,
      };

      setPublishedData(result);
      if (onPublishedSuccess) {
        onPublishedSuccess(result);
      }
    } catch (err) {
      console.error('Publish error:', err);
      setErrorMessage(err.message || 'Failed to complete publishing process.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setFormData({
      title: '',
      courseId: '',
      subject: '',
      description: '',
      lectureId: '',
    });
    setSelectedFile(null);
    setPublishedData(null);
    setQuizQuestions([]);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleResetAndClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{publishedData ? 'Publication Successful' : 'Create & Publish Lecture'}</h3>
          <button className="modal-close-btn" onClick={handleResetAndClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {publishedData ? (
          /* Success Screen View */
          <div className="modal-body success-screen">
            <div className="success-badge-icon">
              <CheckCircle2 size={36} />
            </div>
            <h3>✓ Lecture Published Successfully</h3>
            <p className="success-subtitle">
              Your lecture and initial version V1 are verified and ready on Vidya Setu.
            </p>

            <div className="success-summary-box">
              <div className="success-summary-row">
                <span className="summary-label">Lecture Title:</span>
                <span className="summary-val">{publishedData.lecture.title}</span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">Course / Subject:</span>
                <span className="summary-val">
                  {publishedData.lecture.courseId} • {publishedData.lecture.subject}
                </span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">Version:</span>
                <span className="badge badge-v1">
                  <Sparkles size={12} />
                  {publishedData.lecture.currentVersion || 'V1'}
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
                <span className="summary-label">Version ID:</span>
                <span className="summary-val mono">{publishedData.version.versionId}</span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">File Name:</span>
                <span className="summary-val">{publishedData.version.fileName}</span>
              </div>
              <div className="success-summary-row">
                <span className="summary-label">File Hash (SHA-256):</span>
                <span className="summary-val mono" style={{ fontSize: '0.78rem' }}>
                  {publishedData.version.fileHash}
                </span>
              </div>
            </div>

            {publishedData.lecture.quiz?.questions?.length > 0 ? (
              <div className="success-summary-box" style={{ marginTop: '1rem' }}>
                <div className="success-summary-row">
                  <span className="summary-label">Practice Quiz:</span>
                  <span className="badge badge-published">
                    {publishedData.lecture.quiz.questions.length} Questions Attached
                  </span>
                </div>
                {publishedData.lecture.quiz.questions.map((question, index) => (
                  <div key={question.questionId || index} style={{ marginTop: '0.75rem', color: '#334155' }}>
                    <strong>{index + 1}. {question.text}</strong>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                      {question.options?.map((option) => (
                        <div key={option.key}>
                          {option.key}. {option.text}{option.key === question.correctAnswer ? ' (Correct)' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="info-callout" style={{ marginTop: '1rem' }}>No quiz available for this lecture.</div>
            )}

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleResetAndClose}>
              View in Dashboard
            </button>
          </div>
        ) : (
          /* Create Lecture Form View */
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errorMessage && (
                <div className="error-banner">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  Lecture Title <span className="required">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Distributed Consensus & Raft Protocol"
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="courseId">
                    Course ID <span className="required">*</span>
                  </label>
                  <input
                    id="courseId"
                    name="courseId"
                    type="text"
                    className="form-input"
                    placeholder="e.g. CS401"
                    value={formData.courseId}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="subject">
                    Subject <span className="required">*</span>
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Computer Science"
                    value={formData.subject}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-textarea"
                  placeholder="Brief summary of lecture topics, syllabus references, or notes..."
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quiz Questions (Optional)</label>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '-0.35rem' }}>
                  Add lecture-specific multiple-choice questions. Leave empty to use the generated lecture quiz.
                </p>
                {quizQuestions.map((question, questionIndex) => (
                  <div key={question.questionId} className="success-summary-box" style={{ marginBottom: '0.75rem' }}>
                    <input
                      className="form-input"
                      placeholder={`Question ${questionIndex + 1}`}
                      value={question.text}
                      onChange={(e) => updateQuizQuestion(questionIndex, 'text', e.target.value)}
                      required
                    />
                    {question.options.map((option) => (
                      <input
                        key={option.key}
                        className="form-input"
                        style={{ marginTop: '0.4rem' }}
                        placeholder={`Option ${option.key}`}
                        value={option.text}
                        onChange={(e) => updateQuizOption(questionIndex, option.key, e.target.value)}
                        required
                      />
                    ))}
                    <select
                      className="form-input"
                      style={{ marginTop: '0.4rem' }}
                      value={question.correctAnswer}
                      onChange={(e) => updateQuizQuestion(questionIndex, 'correctAnswer', e.target.value)}
                    >
                      {question.options.map((option) => <option key={option.key} value={option.key}>Correct answer: {option.key}</option>)}
                    </select>
                    <button type="button" className="btn btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => setQuizQuestions((questions) => questions.filter((_, index) => index !== questionIndex))}>
                      Remove Question
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" onClick={() => setQuizQuestions((questions) => [...questions, createEmptyQuestion()])}>
                  Add Question
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Sample Lecture File <span className="required">*</span>
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
                    <div className="dropzone-text">Click to choose or drag & drop sample file</div>
                    <div className="dropzone-hint">Supports video, audio, slide deck, PDF or notes (up to 100MB)</div>
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
                onClick={handleResetAndClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Publishing V1...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Publish V1
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
