import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Lecture } from '../models/Lecture.js';
import { LectureVersion } from '../models/LectureVersion.js';
import { calculateFileHash } from '../utils/fileUpload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');
const DOWNLOAD_CHUNK_SIZE = process.env.NODE_ENV === 'production' ? 64 * 1024 : 10 * 1024;

/**
 * POST /api/lectures
 * Body: { courseId, title, subject, description, lectureId? }
 */
export const createLecture = async (req, res) => {
  try {
    const { courseId, title, subject, description, lectureId: customLectureId } = req.body;

    if (!courseId || !title || !subject) {
      return res.status(400).json({
        success: false,
        message: 'courseId, title, and subject are required fields.',
      });
    }

    const lectureId = customLectureId && customLectureId.trim().length > 0
      ? customLectureId.trim()
      : `lec_${uuidv4().substring(0, 8)}`;

    const existingLecture = await Lecture.findOne({ lectureId });
    if (existingLecture) {
      return res.status(409).json({
        success: false,
        message: `Lecture with ID ${lectureId} already exists.`,
      });
    }

    const lecture = new Lecture({
      lectureId,
      courseId,
      title,
      subject,
      description: description || '',
      currentVersion: 'V1',
    });

    await lecture.save();

    return res.status(201).json({
      success: true,
      message: 'Lecture created successfully.',
      lecture,
    });
  } catch (error) {
    console.error('Error creating lecture:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating lecture.',
      error: error.message,
    });
  }
};

/**
 * GET /api/lectures
 * Fetches all lectures with their current active version details and full version history
 */
export const getLectures = async (req, res) => {
  try {
    const lectures = await Lecture.find().sort({ createdAt: -1 }).lean();

    const enrichedLectures = await Promise.all(
      lectures.map(async (lec) => {
        const versions = await LectureVersion.find({
          lectureId: lec.lectureId,
        })
          .sort({ createdAt: -1 })
          .lean();

        const latestVersion = versions.find((v) => v.isActive) || versions[0] || null;

        return {
          ...lec,
          versionDetails: latestVersion,
          allVersions: versions,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedLectures.length,
      lectures: enrichedLectures,
    });
  } catch (error) {
    console.error('Error fetching lectures:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching lectures.',
      error: error.message,
    });
  }
};

/**
 * GET /api/lectures/:lectureId/versions
 * Fetches all versions for a lecture
 */
export const getLectureVersions = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findOne({ lectureId }).lean();
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: `Lecture not found with ID ${lectureId}.`,
      });
    }

    const versions = await LectureVersion.find({ lectureId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      lecture,
      versions,
    });
  } catch (error) {
    console.error('Error fetching lecture versions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching lecture versions.',
      error: error.message,
    });
  }
};

/**
 * POST /api/lectures/:lectureId/versions
 * Uploads a file, hashes it, and publishes V1 or V2
 * Never overwrites or deletes existing versions
 * Body: multipart/form-data with file, versionId (optional), versionNumber (optional: V1 or V2),
 * and optional updated title, subject, description
 */
export const createLectureVersion = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findOne({ lectureId });
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: `Lecture not found with ID ${lectureId}.`,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'A sample lecture file is required for publishing.',
      });
    }

    const existingVersions = await LectureVersion.find({ lectureId }).select('versionId').lean();
    const versionNumbers = existingVersions
      .map(({ versionId }) => Number(versionId?.match(/_v(\d+)(?:_|$)/i)?.[1]))
      .filter(Number.isInteger);
    const nextVersionNumber = versionNumbers.length > 0
      ? Math.max(...versionNumbers) + 1
      : existingVersions.length > 0 ? existingVersions.length + 1 : 1;
    const versionNumber = `V${nextVersionNumber}`;

    const fileHash = await calculateFileHash(req.file.path);
    const suffix = versionNumber.toLowerCase();
    const versionId = req.body.versionId || `${lectureId}_${suffix}_${uuidv4().substring(0, 6)}`;
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileSize = req.file.size;
    const fileName = req.file.originalname;

    // Step: Mark any previous versions as isActive: false without modifying their other fields
    await LectureVersion.updateMany(
      { lectureId },
      { $set: { isActive: false } }
    );

    // Create the brand new version record
    const lectureVersion = new LectureVersion({
      lectureId,
      versionId,
      fileName,
      fileUrl,
      fileSize,
      fileHash,
      verificationStatus: 'verified',
      isActive: true,
      createdAt: new Date(),
    });

    await lectureVersion.save();

    // Update parent lecture's currentVersion and any updated metadata
    lecture.currentVersion = versionNumber;
    if (req.body.title && req.body.title.trim()) {
      lecture.title = req.body.title.trim();
    }
    if (req.body.subject && req.body.subject.trim()) {
      lecture.subject = req.body.subject.trim();
    }
    if (req.body.description !== undefined) {
      lecture.description = req.body.description.trim();
    }

    await lecture.save();

    // Fetch all versions for complete history response
    const allVersions = await LectureVersion.find({ lectureId }).sort({ createdAt: -1 }).lean();

    return res.status(201).json({
      success: true,
      message: `Lecture version ${versionNumber} published and verified successfully.`,
      lecture,
      version: lectureVersion,
      allVersions,
    });
  } catch (error) {
    console.error('Error publishing lecture version:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while publishing lecture version.',
      error: error.message,
    });
  }
};

/**
 * GET /api/lectures/:lectureId/latest-version
 * Returns the latest active version for a given lecture
 */
export const getLatestVersion = async (req, res) => {
  try {
    const { lectureId } = req.params;

    const lecture = await Lecture.findOne({ lectureId }).lean();
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: `Lecture not found with ID ${lectureId}.`,
      });
    }

    const latestVersion = await LectureVersion.findOne({
      lectureId,
      isActive: true,
    }).lean();

    if (!latestVersion) {
      return res.status(404).json({
        success: false,
        message: `No active version published for lecture ${lectureId}.`,
      });
    }

    return res.status(200).json({
      success: true,
      lectureId,
      lectureTitle: lecture.title,
      currentVersion: lecture.currentVersion,
      latestVersion,
    });
  } catch (error) {
    console.error('Error fetching latest version:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching latest version.',
      error: error.message,
    });
  }
};

const getVersionFile = async (lectureId, versionId) => {
  const version = await LectureVersion.findOne({ lectureId, versionId }).lean();
  if (!version) return null;

  const filePath = path.join(uploadDir, path.basename(version.fileUrl));
  return { version, filePath };
};

/**
 * GET /api/lectures/:lectureId/versions/:versionId/manifest
 * Returns immutable chunk metadata for one exact lecture version.
 */
export const getLectureVersionManifest = async (req, res) => {
  try {
    const { lectureId, versionId } = req.params;
    const versionFile = await getVersionFile(lectureId, versionId);

    if (!versionFile) {
      return res.status(404).json({ success: false, message: 'Lecture version not found.' });
    }

    const fileBuffer = await fs.readFile(versionFile.filePath);
    const totalChunks = Math.ceil(fileBuffer.length / DOWNLOAD_CHUNK_SIZE);
    const chunks = [];

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      const start = chunkIndex * DOWNLOAD_CHUNK_SIZE;
      const chunkBuffer = fileBuffer.subarray(start, start + DOWNLOAD_CHUNK_SIZE);
      const chunkHash = await calculateFileHashFromBuffer(chunkBuffer);
      chunks.push({
        chunkId: `${lectureId}_${versionId}_${chunkIndex}`,
        lectureId,
        versionId,
        chunkIndex,
        chunkSize: chunkBuffer.length,
        chunkHash,
        chunkStatus: 'pending',
      });
    }

    return res.status(200).json({
      success: true,
      lectureId,
      versionId,
      fileSize: versionFile.version.fileSize,
      fileHash: versionFile.version.fileHash,
      totalBytes: fileBuffer.length,
      totalChunks,
      chunkSize: DOWNLOAD_CHUNK_SIZE,
      chunks,
    });
  } catch (error) {
    console.error('Error creating lecture version manifest:', error);
    return res.status(500).json({ success: false, message: 'Could not create lecture version manifest.' });
  }
};

/**
 * GET /api/lectures/:lectureId/versions/:versionId/chunks/:chunkIndex
 * Streams one chunk from one exact lecture version.
 */
export const getLectureVersionChunk = async (req, res) => {
  try {
    const { lectureId, versionId, chunkIndex: chunkIndexParam } = req.params;
    const chunkIndex = Number(chunkIndexParam);
    const versionFile = await getVersionFile(lectureId, versionId);

    if (!versionFile || !Number.isInteger(chunkIndex) || chunkIndex < 0) {
      return res.status(404).json({ success: false, message: 'Lecture version chunk not found.' });
    }

    const fileBuffer = await fs.readFile(versionFile.filePath);
    const start = chunkIndex * DOWNLOAD_CHUNK_SIZE;
    if (start >= fileBuffer.length) {
      return res.status(404).json({ success: false, message: 'Lecture version chunk not found.' });
    }

    const chunkBuffer = fileBuffer.subarray(start, start + DOWNLOAD_CHUNK_SIZE);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': chunkBuffer.length,
      'X-Lecture-Id': lectureId,
      'X-Version-Id': versionId,
      'X-Chunk-Index': String(chunkIndex),
      'X-Chunk-Hash': await calculateFileHashFromBuffer(chunkBuffer),
    });
    return res.status(200).send(chunkBuffer);
  } catch (error) {
    console.error('Error fetching lecture version chunk:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch lecture version chunk.' });
  }
};

const calculateFileHashFromBuffer = (buffer) => {
  return import('crypto').then(({ createHash }) => createHash('sha256').update(buffer).digest('hex'));
};

