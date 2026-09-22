import { Router } from 'express';
import {
  upsertProgress, getProgress, createQuizAttempt, getQuizAttempts,
  createDoubt, getDoubts, replyToDoubt, getTeacherAnalytics,
} from '../controllers/learningController.js';

const router = Router();
router.post('/progress', upsertProgress);
router.get('/progress', getProgress);
router.post('/quiz-attempts', createQuizAttempt);
router.get('/quiz-attempts', getQuizAttempts);
router.post('/doubts', createDoubt);
router.get('/doubts', getDoubts);
router.patch('/doubts/:doubtId/reply', replyToDoubt);
router.get('/teacher/analytics', getTeacherAnalytics);

export default router;