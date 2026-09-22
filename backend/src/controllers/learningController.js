import { v4 as uuidv4 } from 'uuid';
import { StudentProgress } from '../models/StudentProgress.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { StudentDoubt } from '../models/StudentDoubt.js';

const studentIdFor = (req) => req.body?.studentId || req.query?.studentId || 'VS-STU-001';

export const upsertProgress = async (req, res) => {
  const { lectureId, versionId, downloadedBytes, playbackPosition, syncStatus } = req.body;
  if (!lectureId || !versionId) return res.status(400).json({ success: false, message: 'lectureId and versionId are required.' });
  const progress = await StudentProgress.findOneAndUpdate(
    { studentId: studentIdFor(req), lectureId, versionId },
    { studentId: studentIdFor(req), lectureId, versionId, downloadedBytes, playbackPosition, syncStatus: syncStatus || 'Synced', updatedAt: new Date() },
    { upsert: true, new: true, runValidators: true }
  );
  return res.status(200).json({ success: true, progress });
};

export const getProgress = async (req, res) => {
  const progress = await StudentProgress.find({ studentId: studentIdFor(req) }).sort({ updatedAt: -1 }).lean();
  return res.json({ success: true, progress });
};

export const createQuizAttempt = async (req, res) => {
  const { quizId, lectureId, versionId, questionId, selectedAnswer, score, attemptId } = req.body;
  if (!quizId || !lectureId) return res.status(400).json({ success: false, message: 'quizId and lectureId are required.' });
  const resolvedAttemptId = attemptId || uuidv4();
  const attempt = await QuizAttempt.findOneAndUpdate(
    { attemptId: resolvedAttemptId },
    { attemptId: resolvedAttemptId, studentId: studentIdFor(req), quizId, lectureId, versionId, questionId, selectedAnswer, score, status: 'Synced', clientCreatedAt: req.body.createdAt || new Date() },
    { upsert: true, new: true, runValidators: true }
  );
  return res.status(201).json({ success: true, attempt });
};

export const getQuizAttempts = async (req, res) => {
  const attempts = await QuizAttempt.find({ studentId: studentIdFor(req), ...(req.query.lectureId ? { lectureId: req.query.lectureId } : {}) }).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, attempts });
};

export const createDoubt = async (req, res) => {
  const { doubtId, lectureId, versionId, timestamp, text } = req.body;
  if (!doubtId || !lectureId || !text) return res.status(400).json({ success: false, message: 'doubtId, lectureId and text are required.' });
  const doubt = await StudentDoubt.findOneAndUpdate(
    { doubtId },
    { doubtId, lectureId, versionId: versionId || 'unknown', timestamp: timestamp || '00:00', text, studentId: studentIdFor(req), status: 'Synced', clientCreatedAt: req.body.createdAt || new Date() },
    { upsert: true, new: true, runValidators: true }
  );
  return res.status(201).json({ success: true, doubt });
};

export const getDoubts = async (req, res) => {
  const doubts = await StudentDoubt.find(req.query.lectureId ? { lectureId: req.query.lectureId } : {}).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, doubts });
};

export const replyToDoubt = async (req, res) => {
  const { reply } = req.body;
  if (!reply || !reply.trim()) return res.status(400).json({ success: false, message: 'reply is required.' });
  const doubt = await StudentDoubt.findOneAndUpdate({ doubtId: req.params.doubtId }, { teacherReply: reply.trim(), repliedAt: new Date(), status: 'Replied' }, { new: true, runValidators: true });
  if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });
  return res.json({ success: true, doubt });
};

export const getTeacherAnalytics = async (req, res) => {
  const [progress, quizAttempts, quizSubmissions, doubts] = await Promise.all([
    StudentProgress.find().sort({ updatedAt: -1 }).lean(),
    QuizAttempt.find().sort({ createdAt: -1 }).lean(),
    (await import('../models/QuizSubmission.js')).QuizSubmission.find().sort({ updatedAt: -1 }).lean(),
    StudentDoubt.find().sort({ createdAt: -1 }).lean(),
  ]);
  return res.json({ success: true, progress, quizAttempts, quizSubmissions, doubts });
};