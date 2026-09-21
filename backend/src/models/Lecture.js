import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema(
  {
    lectureId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    courseId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    currentVersion: {
      type: String,
      default: 'V1',
    },
  },
  {
    timestamps: true, // provides createdAt, updatedAt
    toJSON: {
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Lecture = mongoose.model('Lecture', lectureSchema);
