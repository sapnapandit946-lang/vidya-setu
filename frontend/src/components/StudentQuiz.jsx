import React, { useState, useEffect } from 'react';
import {
  saveQuizAttempt,
  getQuizAttempt,
  saveQuizSubmission,
  getQuizSubmission,
  resetQuizState,
  getPendingSyncCount,
} from '../utils/indexedDB.js';
import { getQuizForLecture } from '../data/curriculumData.js';
import {
  WifiOff,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Sparkles,
  BookOpen,
  Award,
  Check,
  RefreshCw,
  Layers,
} from 'lucide-react';

export const StudentQuiz = ({ lecture, onBackToLectures, onPendingSyncChange }) => {
  const quizData = getQuizForLecture(lecture);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submissionResult, setSubmissionResult] = useState(null); // When submitted

  const currentQuestion = quizData?.questions?.[currentQIndex];

  // Restore saved attempts or completed submission from IndexedDB
  useEffect(() => {
    const loadSavedState = async () => {
      if (!quizData) return;
      try {
        setLoading(true);

        // 1. Check if complete submission already exists for this lecture quiz
        const savedSubmission = await getQuizSubmission(quizData.quizId, quizData.lectureId);
        if (savedSubmission) {
          setSubmissionResult(savedSubmission);
          setSelectedAnswers(savedSubmission.answersMap || {});
        } else {
          // 2. Otherwise restore question-by-question attempts
          const answersMap = {};
          for (const q of quizData.questions) {
            const attempt = await getQuizAttempt(quizData.quizId, q.questionId);
            if (attempt && attempt.selectedAnswer) {
              answersMap[q.questionId] = attempt.selectedAnswer;
            }
          }
          setSelectedAnswers(answersMap);
        }

        const count = await getPendingSyncCount();
        setPendingSyncCount(count);
        if (onPendingSyncChange) {
          onPendingSyncChange(count);
        }
      } catch (err) {
        console.error('Error loading quiz state from IndexedDB:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSavedState();
  }, [lecture?.lectureId]);

  // Update save status banner when navigating questions
  useEffect(() => {
    if (!currentQuestion || submissionResult) return;
    const currentAns = selectedAnswers[currentQuestion.questionId];
    if (currentAns) {
      setSaveStatus({
        message: 'Answer saved offline ✓',
        isRestored: true,
      });
    } else {
      setSaveStatus(null);
    }
  }, [currentQIndex, selectedAnswers, submissionResult]);

  if (!quizData) {
    return (
      <div className="quiz-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <p style={{ color: '#64748b' }}>No quiz found for this lecture.</p>
        <button type="button" className="btn btn-outline" onClick={onBackToLectures} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back to Lectures
        </button>
      </div>
    );
  }

  const handleSelectOption = async (optionKey) => {
    if (submissionResult) return; // Locked once submitted

    const updatedAnswers = {
      ...selectedAnswers,
      [currentQuestion.questionId]: optionKey,
    };
    setSelectedAnswers(updatedAnswers);

    // Save question attempt locally in IndexedDB
    try {
      await saveQuizAttempt({
        quizId: quizData.quizId,
        lectureId: quizData.lectureId,
        questionId: currentQuestion.questionId,
        selectedAnswer: optionKey,
        correctAnswer: currentQuestion.correctAnswer,
        score: optionKey === currentQuestion.correctAnswer ? 1 : 0,
      });

      const count = await getPendingSyncCount();
      setPendingSyncCount(count);
      if (onPendingSyncChange) {
        onPendingSyncChange(count);
      }

      setSaveStatus({
        message: 'Answer saved offline ✓',
        isRestored: false,
      });
    } catch (err) {
      console.error('Failed to save answer offline:', err);
    }
  };

  const handleNext = () => {
    if (currentQIndex < quizData.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex((prev) => prev - 1);
    }
  };

  // Submit Quiz Calculation and Storage
  const handleSubmitQuiz = async () => {
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    for (const q of quizData.questions) {
      const selected = selectedAnswers[q.questionId];
      if (selected === q.correctAnswer) {
        score += 1;
        correctCount += 1;
      } else {
        wrongCount += 1;
      }

      // Ensure every question has its attempt record saved with score
      await saveQuizAttempt({
        quizId: quizData.quizId,
        lectureId: quizData.lectureId,
        questionId: q.questionId,
        selectedAnswer: selected || null,
        correctAnswer: q.correctAnswer,
        score: selected === q.correctAnswer ? 1 : 0,
      });
    }

    const submission = {
      quizId: quizData.quizId,
      lectureId: quizData.lectureId,
      score,
      totalQuestions: quizData.questions.length,
      correctCount,
      wrongCount,
      answersMap: selectedAnswers,
    };

    try {
      const savedSub = await saveQuizSubmission(submission);
      setSubmissionResult(savedSub);

      const count = await getPendingSyncCount();
      setPendingSyncCount(count);
      if (onPendingSyncChange) {
        onPendingSyncChange(count);
      }
    } catch (err) {
      console.error('Failed to save quiz submission offline:', err);
    }
  };

  const handleRetakeQuiz = async () => {
    try {
      await resetQuizState(quizData.quizId, quizData.lectureId);
      setSelectedAnswers({});
      setSubmissionResult(null);
      setCurrentQIndex(0);
      setSaveStatus(null);
      const count = await getPendingSyncCount();
      setPendingSyncCount(count);
      if (onPendingSyncChange) {
        onPendingSyncChange(count);
      }
    } catch (err) {
      console.error('Failed to reset quiz state:', err);
    }
  };

  if (loading) {
    return (
      <div className="quiz-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <RotateCw size={32} className="spinner" style={{ margin: '0 auto 1rem', color: '#2563eb' }} />
        <p style={{ color: '#64748b' }}>Loading offline practice quiz...</p>
      </div>
    );
  }

  const selectedAnswer = currentQuestion ? selectedAnswers[currentQuestion.questionId] : null;
  const isFinalQuestion = currentQIndex === quizData.questions.length - 1;

  return (
    <div className="quiz-wrapper">
      {/* Top Header Information displaying required items:
          - Course name
          - Lecture title
          - "Practice Quiz"
          - "Based on this lecture"
          - Offline Mode badge */}
      <div className="quiz-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <span className="card-course-tag">{quizData.courseName}</span>
            <span className="badge badge-offline">
              <WifiOff size={13} />
              Offline Mode
            </span>
            <span className="badge badge-based-on">
              <BookOpen size={12} />
              Based on this lecture
            </span>
          </div>

          <h2 className="quiz-title">{quizData.lectureTitle}</h2>
          <div className="quiz-subtitle-row">
            <span className="quiz-practice-tag">{quizData.title}</span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{quizData.subjectName}</span>
          </div>
        </div>

        {/* Small Pending Sync Indicator */}
        <div className="pending-sync-badge-box">
          <div className="pending-sync-badge">
            <Clock size={14} className="pending-clock-icon" />
            <span>
              {pendingSyncCount === 1
                ? '1 quiz attempt pending sync'
                : `${pendingSyncCount} quiz attempts pending sync`}
            </span>
          </div>
          <div className="sync-note">Stored locally in IndexedDB</div>
        </div>
      </div>

      {/* Back to Lectures Button */}
      {onBackToLectures && (
        <button
          type="button"
          className="btn-back-link"
          onClick={onBackToLectures}
          style={{ marginBottom: '1.25rem' }}
        >
          <ArrowLeft size={16} /> Back to Lectures list
        </button>
      )}

      {/* VIEW A: RESULT SCREEN (When Submitted) */}
      {submissionResult ? (
        <div className="quiz-result-card">
          <div className="result-hero-box">
            <div className="result-score-badge">
              <Award size={40} />
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 0.25rem' }}>
              Quiz Completed
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Review your score, correct answers, and detailed step-by-step solutions below.
            </p>

            {/* Submission Status Badges as explicitly requested:
                - "Quiz submitted ✓"
                - "Saved Offline"
                - "Pending Sync" */}
            <div className="submission-badges-row">
              <span className="badge badge-submitted">
                <CheckCircle2 size={13} />
                Quiz submitted ✓
              </span>
              <span className="badge badge-saved-offline">
                <WifiOff size={13} />
                Saved Offline
              </span>
              <span className="badge badge-pending-sync">
                <Clock size={13} />
                Pending Sync
              </span>
            </div>

            {/* Score Grid Cards */}
            <div className="result-stats-grid">
              <div className="result-stat-item">
                <div className="result-stat-val" style={{ color: '#2563eb' }}>
                  {submissionResult.score} / {submissionResult.totalQuestions}
                </div>
                <div className="result-stat-label">Total Score</div>
              </div>

              <div className="result-stat-item">
                <div className="result-stat-val" style={{ color: '#059669' }}>
                  {submissionResult.correctCount}
                </div>
                <div className="result-stat-label">Correct Answers</div>
              </div>

              <div className="result-stat-item">
                <div className="result-stat-val" style={{ color: '#dc2626' }}>
                  {submissionResult.wrongCount}
                </div>
                <div className="result-stat-label">Wrong Answers</div>
              </div>

              <div className="result-stat-item">
                <div className="result-stat-val" style={{ color: '#7c3aed' }}>
                  {Math.round((submissionResult.score / submissionResult.totalQuestions) * 100)}%
                </div>
                <div className="result-stat-label">Accuracy</div>
              </div>
            </div>
          </div>

          {/* Solutions & Question Breakdown */}
          <div className="result-breakdown-section">
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>
              Question Breakdown & Solutions
            </h4>

            <div className="solutions-list">
              {quizData.questions.map((q, idx) => {
                const userAns = submissionResult.answersMap?.[q.questionId];
                const isCorrect = userAns === q.correctAnswer;

                return (
                  <div
                    key={q.questionId}
                    className={`solution-card ${isCorrect ? 'correct' : 'wrong'}`}
                  >
                    <div className="solution-card-header">
                      <span className="solution-q-num">Question {idx + 1}</span>
                      {isCorrect ? (
                        <span className="badge badge-verified" style={{ gap: '0.3rem' }}>
                          <Check size={12} /> Correct (+1)
                        </span>
                      ) : (
                        <span className="badge badge-wrong" style={{ gap: '0.3rem' }}>
                          <XCircle size={12} /> Incorrect (0)
                        </span>
                      )}
                    </div>

                    <h5 className="solution-q-text">{q.text}</h5>

                    {/* Options status */}
                    <div className="solution-options-preview">
                      {q.options.map((opt) => {
                        const wasChosen = userAns === opt.key;
                        const isTheCorrectOne = opt.key === q.correctAnswer;

                        let optClass = 'solution-opt';
                        if (wasChosen && isTheCorrectOne) optClass += ' chosen-correct';
                        else if (wasChosen && !isTheCorrectOne) optClass += ' chosen-wrong';
                        else if (isTheCorrectOne) optClass += ' correct-answer';

                        return (
                          <div key={opt.key} className={optClass}>
                            <span className="solution-opt-key">{opt.key}</span>
                            <span>{opt.text}</span>
                            {wasChosen && <span className="solution-tag chosen">Your Answer</span>}
                            {isTheCorrectOne && <span className="solution-tag correct">Correct Answer</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation / Solution box */}
                    <div className="solution-explanation-box">
                      <strong>Solution / Explanation:</strong>
                      <p style={{ whiteSpace: 'pre-line', marginTop: '0.25rem' }}>{q.solution}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="quiz-footer-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={handleRetakeQuiz}>
              <RefreshCw size={15} /> Retake Quiz
            </button>
            {onBackToLectures && (
              <button type="button" className="btn btn-primary" onClick={onBackToLectures}>
                Done • Back to Lectures
              </button>
            )}
          </div>
        </div>
      ) : (
        /* VIEW B: ACTIVE QUIZ QUESTIONS VIEW */
        <div className="quiz-card">
          {/* Progress row */}
          <div className="quiz-progress-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="quiz-progress-text">
                Question {currentQIndex + 1} of {quizData.questions.length}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {Object.keys(selectedAnswers).length} / {quizData.questions.length} answered
              </span>
            </div>
            <div className="quiz-progress-bar-bg">
              <div
                className="quiz-progress-bar-fill"
                style={{
                  width: `${((currentQIndex + 1) / quizData.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Box */}
          <div className="quiz-question-box">
            <h3 className="quiz-question-text">{currentQuestion.text}</h3>
          </div>

          {/* Offline Saved Banner */}
          {saveStatus && (
            <div className="offline-save-banner">
              <CheckCircle2 size={16} />
              <span>{saveStatus.message}</span>
              <span className="save-subtext">(Saved to IndexedDB • Status: pending)</span>
            </div>
          )}

          {/* Multiple-choice Options */}
          <div className="quiz-options-list">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedAnswer === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`quiz-option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(opt.key)}
                  id={`option-${opt.key}`}
                >
                  <div className={`option-letter-badge ${isSelected ? 'selected' : ''}`}>
                    {opt.key}
                  </div>
                  <div className="option-text">{opt.text}</div>
                  {isSelected && <CheckCircle2 size={18} className="option-check-icon" />}
                </button>
              );
            })}
          </div>

          {/* Footer Actions: Previous, Next Question, and Submit Quiz */}
          <div className="quiz-footer-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handlePrevious}
              disabled={currentQIndex === 0}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            {isFinalQuestion ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitQuiz}
                id="submit-quiz-btn"
                style={{ background: '#059669', borderColor: '#059669' }}
              >
                <CheckCircle2 size={16} />
                Submit Quiz
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                id="next-question-btn"
              >
                Next Question
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
