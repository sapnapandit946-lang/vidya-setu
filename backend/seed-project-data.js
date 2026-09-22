import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { Lecture } from './src/models/Lecture.js';
import { LectureVersion } from './src/models/LectureVersion.js';
import { StudentProgress } from './src/models/StudentProgress.js';
import { QuizSubmission } from './src/models/QuizSubmission.js';
import { StudentDoubt } from './src/models/StudentDoubt.js';
import { CURRICULUM_DATA } from '../frontend/src/data/curriculumData.js';
import { calculateFileHash } from './src/utils/fileUpload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, 'uploads');
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vidya_setu_new';

const sampleSourceFile = path.join(uploadDir, '1790048616410-130775136-SIH25101_TeamEvolve.pdf');

const buildQuiz = (lecture) => ({
  quizId: lecture.quiz?.quizId || `quiz_${lecture.lectureId}`,
  title: lecture.quiz?.title || 'Practice Quiz',
  questions: (lecture.quiz?.questions || []).map((q, index) => ({
    questionId: q.questionId || `q_${index + 1}`,
    questionNumber: q.questionNumber || index + 1,
    text: q.text,
    options: q.options,
    correctAnswer: q.correctAnswer,
    solution: q.solution || '',
  })),
});

const ensureUploadDir = async () => {
  await fs.mkdir(uploadDir, { recursive: true });
};

const ensureLectureRecord = async (course, subject, lecture) => {
  const lectureData = {
    lectureId: lecture.lectureId,
    courseId: course.courseId,
    title: lecture.title,
    subject: subject.subjectName,
    description: lecture.description || '',
    currentVersion: 'V1',
    quiz: buildQuiz(lecture),
  };

  const existing = await Lecture.findOne({ lectureId: lecture.lectureId }).lean();
  if (existing) {
    await Lecture.updateOne({ lectureId: lecture.lectureId }, { $set: lectureData });
    return await Lecture.findOne({ lectureId: lecture.lectureId });
  }

  return Lecture.create(lectureData);
};

const ensureFileCopy = async (lectureId, versionNumber) => {
  const targetName = `${lectureId}_${versionNumber.toLowerCase()}.pdf`;
  const targetPath = path.join(uploadDir, targetName);

  try {
    await fs.access(sampleSourceFile);
  } catch {
    const placeholder = Buffer.from(`Project seed for ${lectureId} ${versionNumber}`);
    await fs.writeFile(targetPath, placeholder);
    return { fileName: targetName, filePath: targetPath, fileSize: placeholder.length };
  }

  await fs.copyFile(sampleSourceFile, targetPath);
  const stat = await fs.stat(targetPath);
  return { fileName: targetName, filePath: targetPath, fileSize: stat.size };
};

const ensureVersionRecord = async (lectureId, versionNumber, opts = {}) => {
  const versionKey = `${lectureId}_${versionNumber.toLowerCase()}`;
  const existing = await LectureVersion.findOne({ lectureId, versionId: { $regex: `${versionKey}` } });
  if (existing) {
    return existing;
  }

  const { fileName, filePath, fileSize } = await ensureFileCopy(lectureId, versionNumber);
  const fileHash = await calculateFileHash(filePath);
  const versionId = `${lectureId}_${versionNumber.toLowerCase()}_${Date.now().toString(36)}`;

  const doc = await LectureVersion.create({
    lectureId,
    versionId,
    fileName,
    fileUrl: `/uploads/${fileName}`,
    fileSize,
    fileHash,
    verificationStatus: 'verified',
    isActive: true,
    correctionDetails: {
      hasCorrection: Boolean(opts.hasCorrection),
      note: opts.note || '',
      timestamp: opts.timestamp || '',
      summary: opts.summary || '',
      previousVersion: opts.previousVersion || 'V1',
      newVersion: versionNumber,
    },
    createdAt: new Date(),
  });

  await Lecture.updateOne({ lectureId }, { $set: { currentVersion: versionNumber } });
  return doc;
};

const seedProgressAndDoubts = async () => {
  const lectureDocs = await Lecture.find().lean();
  if (!lectureDocs.length) return;

  for (const lecture of lectureDocs.slice(0, 2)) {
    const versionDoc = await LectureVersion.findOne({ lectureId: lecture.lectureId, isActive: true }).lean();
    if (!versionDoc) continue;

    await StudentProgress.findOneAndUpdate(
      { studentId: 'VS-STU-001', lectureId: lecture.lectureId, versionId: versionDoc.versionId },
      {
        studentId: 'VS-STU-001',
        lectureId: lecture.lectureId,
        versionId: versionDoc.versionId,
        downloadedBytes: Math.max(1000, versionDoc.fileSize * 0.65),
        playbackPosition: 720,
        syncStatus: 'Synced',
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await QuizSubmission.findOneAndUpdate(
      { quizId: lecture.quiz?.quizId || `quiz_${lecture.lectureId}`, lectureId: lecture.lectureId },
      {
        quizId: lecture.quiz?.quizId || `quiz_${lecture.lectureId}`,
        lectureId: lecture.lectureId,
        score: 80,
        totalQuestions: Math.max(lecture.quiz?.questions?.length || 1, 1),
        correctCount: 4,
        wrongCount: 1,
        answersMap: { q1: 'B', q2: 'A' },
        status: 'synced',
        clientCreatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await StudentDoubt.findOneAndUpdate(
      { doubtId: `${lecture.lectureId}_doubt_1` },
      {
        doubtId: `${lecture.lectureId}_doubt_1`,
        lectureId: lecture.lectureId,
        versionId: versionDoc.versionId,
        studentId: 'VS-STU-001',
        timestamp: '08:25',
        text: `I want to clarify the concept of ${lecture.title}.`,
        status: 'synced',
        teacherReply: 'This topic is covered in the first part of the lesson; review the worked examples and practice quiz.',
        repliedAt: new Date(),
        clientCreatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  }
};

const main = async () => {
  await ensureUploadDir();
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);

  for (const course of CURRICULUM_DATA) {
    for (const subject of course.subjects) {
      for (const lecture of subject.lectures) {
        await ensureLectureRecord(course, subject, lecture);
        const versionOne = await ensureVersionRecord(lecture.lectureId, 'V1');

        if (lecture.lectureId === 'lec_math10_quad_01' && !(await LectureVersion.findOne({ lectureId: lecture.lectureId, versionId: { $regex: 'v2' } }))) {
          const v2 = await ensureVersionRecord(lecture.lectureId, 'V2', {
            hasCorrection: true,
            note: 'Corrected example and extra practice formula',
            timestamp: '12:40',
            summary: 'Added a worked discriminant example and final review notes.',
            previousVersion: 'V1',
          });
          await LectureVersion.updateOne({ _id: v2._id }, { $set: { isActive: true } });
          await LectureVersion.updateMany({ lectureId: lecture.lectureId, _id: { $ne: v2._id } }, { $set: { isActive: false } });
          await Lecture.updateOne({ lectureId: lecture.lectureId }, { $set: { currentVersion: 'V2' } });
        }

        const activeVersion = await LectureVersion.findOne({ lectureId: lecture.lectureId, isActive: true }).lean();
        if (activeVersion) {
          const lectureDoc = await Lecture.findOne({ lectureId: lecture.lectureId });
          if (lectureDoc) {
            lectureDoc.currentVersion = activeVersion.versionId.includes('_v2_') ? 'V2' : 'V1';
            await lectureDoc.save();
          }
        }

        await LectureVersion.findOneAndUpdate(
          { lectureId: lecture.lectureId, isActive: true },
          { $set: { verificationStatus: 'verified' } },
          { new: true }
        );

        console.log(`Seeded lecture: ${lecture.lectureId} / ${versionOne.versionId || 'V1'}`);
      }
    }
  }

  await seedProgressAndDoubts();

  const lectureCount = await Lecture.countDocuments();
  const versionCount = await LectureVersion.countDocuments();
  const progressCount = await StudentProgress.countDocuments();
  const doubtCount = await StudentDoubt.countDocuments();
  const submissionCount = await QuizSubmission.countDocuments();

  console.log(JSON.stringify({
    lectureCount,
    versionCount,
    progressCount,
    doubtCount,
    submissionCount,
    database: mongoose.connection.name,
    status: 'seeded'
  }, null, 2));

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});
