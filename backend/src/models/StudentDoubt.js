import mongoose from 'mongoose';

const studentDoubtSchema = new mongoose.Schema(
  {
    doubtId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lectureId: {
      type: String,
      required: true,
      index: true,
    },
    versionId: { type: String, default: 'unknown', index: true },
    studentId: { type: String, default: 'VS-STU-001', index: true },
    timestamp: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      default: 'synced',
    },
    teacherReply: { type: String, default: '' },
    repliedAt: { type: Date, default: null },
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

export const StudentDoubt = mongoose.model('StudentDoubt', studentDoubtSchema);
