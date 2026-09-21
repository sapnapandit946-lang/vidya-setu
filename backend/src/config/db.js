import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const atlasUri = process.env.MONGODB_URI;

  if (atlasUri && atlasUri.trim().length > 0) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      const conn = await mongoose.connect(atlasUri);
      console.log(`Connected to MongoDB Atlas: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn('Failed to connect to MongoDB Atlas URI:', error.message);
      console.log('Falling back to In-Memory MongoDB for local development/testing...');
    }
  } else {
    console.log('No MONGODB_URI provided in environment. Initializing local In-Memory MongoDB Server...');
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
