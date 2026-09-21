import mongoose from 'mongoose';

const correctionSchema = new mongoose.Schema({
  previousVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LectureVersion', required: true },
  newVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LectureVersion', required: true },
  changedSectionStart: { type: Number, min: 0, required: true },
  changedSectionEnd: { type: Number, min: 0, required: true },
  correctionText: { type: String, required: true, trim: true },
  updateSeverity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject: { type: String, default: '' },
  teacherId: { type: String, required: true, trim: true },
  latestPublishedVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LectureVersion', default: null },
}, { timestamps: true });

const lectureVersionSchema = new mongoose.Schema({
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true, index: true },
  versionNumber: { type: Number, required: true, min: 1 },
  versionLabel: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  file: {
    path: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    fileSize: { type: Number, required: true, min: 0 },
    chunkSize: { type: Number, required: true, min: 1 },
    totalChunks: { type: Number, required: true, min: 1 },
    fileSha256: { type: String, required: true },
    chunkHashes: { type: [String], required: true },
  },
  correction: { type: correctionSchema, default: null },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });
lectureVersionSchema.index({ lectureId: 1, versionNumber: 1 }, { unique: true });

const syncActionSchema = new mongoose.Schema({
  actionId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['progress', 'quiz_submission', 'doubt'], required: true },
  studentId: { type: String, required: true },
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  versionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LectureVersion', required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, required: true },
}, { timestamps: true });

const doubtSchema = new mongoose.Schema({
  studentId: { type: String, required: true }, lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  versionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LectureVersion', required: true },
  videoTimestamp: { type: Number, required: true, min: 0 }, questionText: { type: String, required: true, trim: true },
  teacherReply: { type: String, default: null }, repliedAt: { type: Date, default: null },
}, { timestamps: true });

const quizAttemptSchema = new mongoose.Schema({
  studentId: { type: String, required: true }, quizId: { type: String, required: true },
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  versionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LectureVersion', required: true },
  studentAnswers: { type: mongoose.Schema.Types.Mixed, required: true }, score: { type: Number, required: true },
  submittedAt: { type: Date, required: true },
}, { timestamps: true });

export const Lecture = mongoose.model('Lecture', lectureSchema);
export const LectureVersion = mongoose.model('LectureVersion', lectureVersionSchema);
export const SyncAction = mongoose.model('SyncAction', syncActionSchema);
export const Doubt = mongoose.model('Doubt', doubtSchema);
export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);