import { Router } from 'express';
import {
  createLecture,
  getLectures,
  createLectureVersion,
  getLatestVersion,
  getLectureVersions,
  getLectureVersionManifest,
  getLectureVersionChunk,
} from '../controllers/lectureController.js';
import { upload } from '../utils/fileUpload.js';

const router = Router();

// POST /api/lectures - Create lecture record
router.post('/', createLecture);

// GET /api/lectures - Get all lectures with current version
router.get('/', getLectures);

// GET /api/lectures/:lectureId/versions - Get all versions for a lecture
router.get('/:lectureId/versions', getLectureVersions);

// POST /api/lectures/:lectureId/versions - Publish version V1 or V2 with sample file
router.post('/:lectureId/versions', upload.single('file'), createLectureVersion);

// GET /api/lectures/:lectureId/versions/:versionId/manifest - Get exact version chunk metadata
router.get('/:lectureId/versions/:versionId/manifest', getLectureVersionManifest);

// GET /api/lectures/:lectureId/versions/:versionId/chunks/:chunkIndex - Get one exact version chunk
router.get('/:lectureId/versions/:versionId/chunks/:chunkIndex', getLectureVersionChunk);

// GET /api/lectures/:lectureId/latest-version - Get latest active version
router.get('/:lectureId/latest-version', getLatestVersion);

export default router;

