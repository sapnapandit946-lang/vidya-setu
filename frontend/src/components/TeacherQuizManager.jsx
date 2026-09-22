import React, { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Save, Trash2, X } from 'lucide-react';

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

const normalizeQuestion = (question) => ({
  questionId: question.questionId || createEmptyQuestion().questionId,
  text: question.text || '',
  options: ['A', 'B', 'C', 'D'].map((key) => ({
    key,
    text: question.options?.find((option) => option.key === key)?.text || '',
  })),
  correctAnswer: question.correctAnswer || 'A',
});

export const TeacherQuizManager = ({ isOpen, lecture, onClose, onSaved }) => {
  const [questions, setQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (isOpen && lecture) {
      setQuestions((lecture.quiz?.questions || []).map(normalizeQuestion));
      setErrorMessage('');
      setSavedMessage('');
    }
  }, [isOpen, lecture]);

  if (!isOpen || !lecture) return null;

  const updateQuestion = (questionIndex, field, value) => {
    setQuestions((current) => current.map((question, index) => (
      index === questionIndex ? { ...question, [field]: value } : question
    )));
  };

  const updateOption = (questionIndex, optionKey, value) => {
    setQuestions((current) => current.map((question, index) => (
      index === questionIndex
        ? { ...question, options: question.options.map((option) => option.key === optionKey ? { ...option, text: value } : option) }
        : question
    )));
  };

  const handleSave = async () => {
    setErrorMessage('');
    setSavedMessage('');
    if (questions.some((question) => !question.text.trim() || question.options.some((option) => !option.text.trim()))) {
      setErrorMessage('Complete the question and all four options before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/lectures/${encodeURIComponent(lecture.lectureId)}/quiz`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: lecture.quiz?.quizId || `quiz_${lecture.lectureId}`,
          title: lecture.quiz?.title || 'Practice Quiz',
          versionId: lecture.versionDetails?.versionId || lecture.versionId || null,
          questions,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to save quiz.');
      setSavedMessage('Quiz saved to this lecture.');
      onSaved?.(data.lecture);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save quiz.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card teacher-quiz-manager" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{lecture.quiz?.questions?.length ? 'Manage Quiz' : 'Add Quiz'}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="teacher-quiz-meta">
            <strong>{lecture.title}</strong>
            <div className="mono" style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#64748b' }}>
              Lecture ID: {lecture.lectureId}
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.82rem', color: '#64748b' }}>
              Version ID: {lecture.versionDetails?.versionId || lecture.versionId || 'Not published'}
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className={`badge ${questions.length ? 'badge-published' : 'badge-v1'}`}>
                {questions.length ? <><CheckCircle2 size={12} /> Quiz Available</> : 'No quiz available'}
              </span>
            </div>
          </div>

          {errorMessage && <div className="error-banner">{errorMessage}</div>}
          {savedMessage && <div className="info-callout">{savedMessage}</div>}

          <div className="form-group">
            <label className="form-label">Quiz Questions</label>
            {questions.map((question, questionIndex) => (
              <div key={question.questionId} className="teacher-quiz-question">
                <input
                  className="form-input"
                  placeholder={`Question ${questionIndex + 1}`}
                  value={question.text}
                  onChange={(event) => updateQuestion(questionIndex, 'text', event.target.value)}
                />
                <div className="teacher-quiz-options">
                  {question.options.map((option) => (
                    <label key={option.key}>
                      <span>{option.key}</span>
                      <input
                        className="form-input"
                        placeholder={`Option ${option.key}`}
                        value={option.text}
                        onChange={(event) => updateOption(questionIndex, option.key, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
                <label className="teacher-quiz-correct">
                  <span>Correct answer</span>
                  <select
                    className="form-input"
                    value={question.correctAnswer}
                    onChange={(event) => updateQuestion(questionIndex, 'correctAnswer', event.target.value)}
                  >
                    {question.options.map((option) => <option key={option.key} value={option.key}>{option.key}</option>)}
                  </select>
                </label>
                <button type="button" className="btn btn-outline" style={{ marginTop: '0.5rem' }} onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))}>
                  <Trash2 size={14} /> Remove Question
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-outline" onClick={() => setQuestions((current) => [...current, createEmptyQuestion()])}>
              <Plus size={15} /> Add Question
            </button>
          </div>
        </div>
        <div className="modal-footer teacher-quiz-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={15} /> {isSaving ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherQuizManager;
