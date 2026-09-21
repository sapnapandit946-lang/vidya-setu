import { Router } from 'express';
import { SyncAction } from '../models.js';

const router = Router();
router.get('/sync/actions', async (req, res, next) => {
  try { return res.json(await SyncAction.find(req.query).sort({ createdAt: -1 })); } catch (error) { return next(error); }
});
export default router;