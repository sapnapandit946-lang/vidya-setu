import mongoose from 'mongoose';

const studentProgressSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, default: 'VS-STU-001', index: true },
    lectureId: { type: String, required: true, index: true },
    versionId: { type: String, required: true, index: true },
    downloadedBytes: { type: Number, default: 0, min: 0 },
    playbackPosition: { type: Number, default: 0, min: 0 },
    syncStatus: { type: String, default: 'Synced' },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { transform: (doc, ret) => { delete ret._id; delete ret.__v; return ret; } } }
);

studentProgressSchema.index({ studentId: 1, lectureId: 1, versionId: 1 }, { unique: true });

export const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);