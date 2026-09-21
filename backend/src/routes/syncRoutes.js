import express from 'express';
import { processMicroSync, getSyncStatus } from '../controllers/syncController.js';

const router = express.Router();

// Synchronize pending records (quizzes + doubts)
router.post('/microsync', processMicroSync);

// Status check
router.get('/status', getSyncStatus);

export default router;
