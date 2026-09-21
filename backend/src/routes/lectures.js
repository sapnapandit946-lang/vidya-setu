import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { Lecture, LectureVersion } from '../models.js';

const router = Router();
const upload = multer({ dest: path.join(config.uploadDir, 'incoming') });
const validId = (value) => /^[a-f\d]{24}$/i.test(value);
const notFound = (res) => res.status(404).json({ error: 'not_found' });

async function hashFile(filePath, chunkSize) {
  const data = await fs.readFile(filePath);
  const fileSha256 = crypto.createHash('sha256').update(data).digest('hex');
  const chunkHashes = [];
  for (let offset = 0; offset < data.length; offset += chunkSize) {
    chunkHashes.push(crypto.createHash('sha256').update(data.subarray(offset, offset + chunkSize)).digest('hex'));
  }
  return { data, fileSha256, chunkHashes };
}

const manifestFor = (version) => ({
  lectureId: version.lectureId.toString(), versionId: version._id.toString(), version: version.versionLabel,
  fileSize: version.file.fileSize, chunkSize: version.file.chunkSize, totalChunks: version.file.totalChunks,
  fileSha256: version.file.fileSha256, chunkHashes: version.file.chunkHashes,
});

router.post('/lectures', async (req, res, next) => {
  try {
    const { title, description, subject, teacherId } = req.body;
    if (!title || !teacherId) return res.status(400).json({ error: 'title_and_teacherId_required' });
    const lecture = await Lecture.create({ title, description, subject, teacherId });
    return res.status(201).json(lecture);
  } catch (error) { return next(error); }
});

router.get('/lectures/:lectureId', async (req, res, next) => {
  try { if (!validId(req.params.lectureId)) return notFound(res); const lecture = await Lecture.findById(req.params.lectureId); return lecture ? res.json(lecture) : notFound(res); } catch (error) { return next(error); }
});

router.get('/lectures/:lectureId/versions', async (req, res, next) => {
  try { if (!validId(req.params.lectureId)) return notFound(res); return res.json(await LectureVersion.find({ lectureId: req.params.lectureId }).sort({ versionNumber: 1 })); } catch (error) { return next(error); }
});

router.get('/lectures/:lectureId/latest', async (req, res, next) => {
  try {
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture?.latestPublishedVersionId) return notFound(res);
    const version = await LectureVersion.findById(lecture.latestPublishedVersionId);
    return version ? res.json(version) : notFound(res);
  } catch (error) { return next(error); }
});

router.get('/versions/:versionId', async (req, res, next) => {
  try { const version = await LectureVersion.findById(req.params.versionId); return version ? res.json(version) : notFound(res); } catch (error) { return next(error); }
});

router.post('/lectures/:lectureId/versions', upload.single('file'), async (req, res, next) => {
  try {
    if (!validId(req.params.lectureId) || !req.file) return res.status(400).json({ error: 'lectureId_and_file_required' });
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture) return notFound(res);
    const previous = await LectureVersion.findOne({ lectureId: lecture._id }).sort({ versionNumber: -1 });
    const versionNumber = (previous?.versionNumber || 0) + 1;
    const chunkSize = Number(req.body.chunkSize || config.chunkSize);
    if (!Number.isInteger(chunkSize) || chunkSize < 1) return res.status(400).json({ error: 'invalid_chunkSize' });
    const { data, fileSha256, chunkHashes } = await hashFile(req.file.path, chunkSize);
    const directory = path.join(config.uploadDir, lecture._id.toString(), `v${versionNumber}`);
    await fs.mkdir(directory, { recursive: true });
    const finalPath = path.join(directory, req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
    await fs.writeFile(finalPath, data);
    await fs.unlink(req.file.path);
    const version = await LectureVersion.create({ lectureId: lecture._id, versionNumber, versionLabel: `V${versionNumber}`, file: { path: finalPath, originalName: req.file.originalname, mimeType: req.file.mimetype, fileSize: data.length, chunkSize, totalChunks: chunkHashes.length, fileSha256, chunkHashes } });
    return res.status(201).json({ version, manifest: manifestFor(version) });
  } catch (error) { if (req.file?.path) await fs.unlink(req.file.path).catch(() => {}); return next(error); }
});

router.post('/lectures/:lectureId/versions/:versionId/publish', async (req, res, next) => {
  try {
    const lecture = await Lecture.findById(req.params.lectureId);
    const version = await LectureVersion.findOne({ _id: req.params.versionId, lectureId: req.params.lectureId });
    if (!lecture || !version) return notFound(res);
    const previous = lecture.latestPublishedVersionId ? await LectureVersion.findById(lecture.latestPublishedVersionId) : null;
    const correction = previous ? { previousVersionId: previous._id, newVersionId: version._id, changedSectionStart: Number(req.body.changedSectionStart), changedSectionEnd: Number(req.body.changedSectionEnd), correctionText: req.body.correctionText, updateSeverity: req.body.updateSeverity } : null;
    if (previous && (!Number.isFinite(correction.changedSectionStart) || !Number.isFinite(correction.changedSectionEnd) || !correction.correctionText || !['low', 'medium', 'high'].includes(correction.updateSeverity))) return res.status(400).json({ error: 'correction_metadata_required' });
    version.status = 'published'; version.publishedAt = new Date(); version.correction = correction; await version.save();
    lecture.latestPublishedVersionId = version._id; await lecture.save();
    return res.json({ version, correction, manifest: manifestFor(version) });
  } catch (error) { return next(error); }
});

router.get('/versions/:versionId/manifest', async (req, res, next) => {
  try { const version = await LectureVersion.findById(req.params.versionId); return version ? res.json(manifestFor(version)) : notFound(res); } catch (error) { return next(error); }
});

router.get('/versions/:versionId/chunks/:chunkIndex', async (req, res, next) => {
  try {
    const version = await LectureVersion.findById(req.params.versionId);
    const chunkIndex = Number(req.params.chunkIndex);
    if (!version) return notFound(res);
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= version.file.totalChunks) return res.status(416).json({ error: 'invalid_chunk_index' });
    const start = chunkIndex * version.file.chunkSize;
    const end = Math.min(version.file.fileSize, start + version.file.chunkSize) - 1;
    const data = await fs.readFile(version.file.path);
    res.status(206).set({ 'Content-Type': version.file.mimeType, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${version.file.fileSize}`, 'X-Chunk-Sha256': version.file.chunkHashes[chunkIndex] }).send(data.subarray(start, end + 1));
  } catch (error) { return next(error); }
});

export default router;