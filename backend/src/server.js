import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config.js';

const server = app.listen(config.port, () => {
  console.log(`Vidya Setu backend listening on port ${config.port}`);
});

mongoose.connect(config.mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error(`MongoDB connection failed: ${error.message}`));

const shutdown = async () => {
  await mongoose.disconnect();
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);