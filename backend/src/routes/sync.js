import { Router } from 'express';
import mongoose from 'mongoose';
import { LectureVersion, SyncAction, Doubt, QuizAttempt } from '../models.js';

const router = Router();
const types = new Set(['progress', 'quiz_submission', 'doubt']);

async function processAction(action) {
  if (!action || !action.actionId || !action.studentId || !action.lectureId || !action.versionId || !action.payload || !action.createdAt || !types.has(action.type)) return { actionId: action?.actionId || null, status: 'error', error: 'invalid_action' };
  if (!mongoose.isValidObjectId(action.lectureId) || !mongoose.isValidObjectId(action.versionId)) return { actionId: action.actionId, status: 'error', error: 'invalid_reference' };
  const version = await LectureVersion.findOne({ _id: action.versionId, lectureId: action.lectureId });
  if (!version) return { actionId: action.actionId, status: 'error', error: 'version_not_found' };
  try { await SyncAction.create({ ...action, createdAt: new Date(action.createdAt) }); return { actionId: action.actionId, status: 'success' }; }
  catch (error) { if (error.code !== 11000) return { actionId: action.actionId, status: 'retry', error: 'persistence_failed' }; return { actionId: action.actionId, status: 'success', duplicate: true }; }
}

router.post('/sync/batch', async (req, res, next) => {
  try { if (!Array.isArray(req.body.actions)) return res.status(400).json({ error: 'actions_array_required' }); return res.json({ results: await Promise.all(req.body.actions.map(processAction)) }); } catch (error) { return next(error); }
});

router.post('/doubts', async (req, res, next) => { try { const doubt = await Doubt.create(req.body); return res.status(201).json(doubt); } catch (error) { return next(error); } });
router.get('/doubts', async (req, res, next) => { try { return res.json(await Doubt.find(req.query).sort({ createdAt: -1 })); } catch (error) { return next(error); } });
router.patch('/doubts/:doubtId/reply', async (req, res, next) => { try { const doubt = await Doubt.findByIdAndUpdate(req.params.doubtId, { teacherReply: req.body.teacherReply, repliedAt: new Date() }, { new: true, runValidators: true }); return doubt ? res.json(doubt) : res.status(404).json({ error: 'not_found' }); } catch (error) { return next(error); } });
router.post('/quiz-attempts', async (req, res, next) => { try { const attempt = await QuizAttempt.create(req.body); return res.status(201).json(attempt); } catch (error) { return next(error); } });
router.get('/quiz-attempts', async (req, res, next) => { try { return res.json(await QuizAttempt.find(req.query).sort({ submittedAt: -1 })); } catch (error) { return next(error); } });

export default router;