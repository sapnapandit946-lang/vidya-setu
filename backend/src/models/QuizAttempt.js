import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    attemptId: { type: String, required: true, unique: true, index: true },
    studentId: { type: String, required: true, default: 'VS-STU-001', index: true },
    quizId: { type: String, required: true, index: true },
    lectureId: { type: String, required: true, index: true },
    versionId: { type: String, default: 'unknown' },
    questionId: { type: String, default: null },
    selectedAnswer: { type: String, default: null },
    score: { type: Number, default: 0 },
    status: { type: String, default: 'Synced' },
    clientCreatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { transform: (doc, ret) => { delete ret._id; delete ret.__v; return ret; } } }
);

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);