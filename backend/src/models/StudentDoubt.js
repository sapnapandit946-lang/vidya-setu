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
