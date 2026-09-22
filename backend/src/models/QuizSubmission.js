import mongoose from 'mongoose';

const quizSubmissionSchema = new mongoose.Schema(
  {
    quizId: {
      type: String,
      required: true,
    },
    lectureId: {
      type: String,
      required: true,
    },
    versionId: {
      type: String,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    wrongCount: {
      type: Number,
      default: 0,
    },
    answersMap: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      default: 'synced',
    },
    clientCreatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

quizSubmissionSchema.index({ quizId: 1, lectureId: 1 }, { unique: true });

export const QuizSubmission = mongoose.model('QuizSubmission', quizSubmissionSchema);
