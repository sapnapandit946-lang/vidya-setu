import mongoose from 'mongoose';

const lectureVersionSchema = new mongoose.Schema(
  {
    lectureId: {
      type: String,
      required: true,
      index: true,
    },
    versionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
    },
    verificationStatus: {
      type: String,
      default: 'verified', // Contract approved: "Verified"
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    correctionDetails: {
      hasCorrection: { type: Boolean, default: false },
      note: { type: String, default: '' },
      timestamp: { type: String, default: '' }, // e.g. "18:42" or "05:30"
      summary: { type: String, default: '' },
      previousVersion: { type: String, default: 'V1' },
      newVersion: { type: String, default: 'V2' },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const LectureVersion = mongoose.model('LectureVersion', lectureVersionSchema);
