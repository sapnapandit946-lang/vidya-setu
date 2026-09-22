import { StudentDoubt } from '../models/StudentDoubt.js';
import { QuizSubmission } from '../models/QuizSubmission.js';
import { StudentProgress } from '../models/StudentProgress.js';
import { QuizAttempt } from '../models/QuizAttempt.js';

/**
 * Handles batch synchronization of offline quiz submissions and doubts
 * Route: POST /api/sync/microsync
 */
export const processMicroSync = async (req, res) => {
  try {
    const { progress = [], attempts = [], quizzes = [], doubts = [] } = req.body;

    console.log(`[MicroSync] Received batch sync request: ${progress.length} progress, ${attempts.length} attempts, ${quizzes.length} quizzes, ${doubts.length} doubts`);

    const syncedProgress = [];
    const syncedAttempts = [];
    const syncedQuizzes = [];
    const syncedDoubts = [];

    for (const item of progress) {
      if (!item.lectureId || !item.versionId) continue;
      const record = await StudentProgress.findOneAndUpdate(
        { studentId: item.studentId || 'VS-STU-001', lectureId: item.lectureId, versionId: item.versionId },
        { ...item, studentId: item.studentId || 'VS-STU-001', syncStatus: 'Synced', updatedAt: new Date() },
        { upsert: true, new: true }
      );
      syncedProgress.push({ lectureId: record.lectureId, versionId: record.versionId, status: 'Synced' });
    }

    for (const item of attempts) {
      if (!item.quizId || !item.lectureId || !item.attemptId) continue;
      const record = await QuizAttempt.findOneAndUpdate(
        { attemptId: item.attemptId },
        { ...item, studentId: item.studentId || 'VS-STU-001', status: 'Synced' },
        { upsert: true, new: true }
      );
      syncedAttempts.push({ attemptId: record.attemptId, status: 'Synced' });
    }

    // Process completed quiz submissions.
    for (const q of quizzes) {
      if (!q.quizId || !q.lectureId) continue;

      const record = await QuizSubmission.findOneAndUpdate(
        { quizId: q.quizId, lectureId: q.lectureId },
        {
          quizId: q.quizId,
          lectureId: q.lectureId,
          versionId: q.versionId || null,
          score: q.score || 0,
          totalQuestions: q.totalQuestions || 0,
          correctCount: q.correctCount || 0,
          wrongCount: q.wrongCount || 0,
          answersMap: q.answersMap || {},
          status: 'synced',
          clientCreatedAt: q.createdAt ? new Date(q.createdAt) : new Date(),
        },
        { upsert: true, new: true }
      );

      syncedQuizzes.push({
        quizId: record.quizId,
        lectureId: record.lectureId,
        status: 'synced',
      });
    }

    // 2. Process Doubts
    for (const d of doubts) {
      if (!d.doubtId || !d.lectureId) continue;

      const record = await StudentDoubt.findOneAndUpdate(
        { doubtId: d.doubtId },
        {
          doubtId: d.doubtId,
          lectureId: d.lectureId,
          timestamp: d.timestamp || '00:00',
          text: d.text || '',
          status: 'synced',
          clientCreatedAt: d.createdAt ? new Date(d.createdAt) : new Date(),
        },
        { upsert: true, new: true }
      );

      syncedDoubts.push({
        doubtId: record.doubtId,
        lectureId: record.lectureId,
        timestamp: record.timestamp,
        status: 'synced',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Learning records synced successfully',
      syncedQuizzesCount: syncedQuizzes.length,
      syncedDoubtsCount: syncedDoubts.length,
      syncedProgressCount: syncedProgress.length,
      syncedAttemptsCount: syncedAttempts.length,
      syncedProgress,
      syncedAttempts,
      syncedQuizzes,
      syncedDoubts,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[MicroSync] Error processing sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to synchronize offline data',
      error: error.message,
    });
  }
};

/**
 * Health / status check for sync service
 * Route: GET /api/sync/status
 */
export const getSyncStatus = async (req, res) => {
  try {
    const totalDoubts = await StudentDoubt.countDocuments();
    const totalQuizzes = await QuizSubmission.countDocuments();

    res.status(200).json({
      success: true,
      status: 'active',
      service: 'Vidya Setu MicroSync Service',
      totalDoubtsSynced: totalDoubts,
      totalQuizzesSynced: totalQuizzes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
