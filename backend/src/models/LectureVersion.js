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
