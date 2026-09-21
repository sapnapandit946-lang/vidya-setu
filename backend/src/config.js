import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vidya_setu',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  chunkSize: Number(process.env.CHUNK_SIZE || 1024 * 1024),
};