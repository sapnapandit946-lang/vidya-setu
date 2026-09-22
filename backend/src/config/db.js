import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const atlasUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vidya_setu_new';

  try {
    console.log(`Connecting to MongoDB at ${atlasUri.startsWith('mongodb://127.0.0.1') ? 'local database' : 'configured database'}...`);
    const conn = await mongoose.connect(atlasUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.warn('Failed to connect to configured MongoDB:', error.message);
    console.log('Falling back to In-Memory MongoDB for local development/testing...');
  }

  try {
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`Connected to In-Memory MongoDB Server: ${conn.connection.host}`);
  } catch (err) {
    console.error('Fatal error starting MongoDB connection:', err);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
