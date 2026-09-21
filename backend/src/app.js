import express from 'express';
import cors from 'cors';
import lectureRoutes from './routes/lectures.js';
import syncRoutes from './routes/sync.js';
import academicRoutes from './routes/academic.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'vidya-setu-backend' });
});
app.use('/api', lectureRoutes);
app.use('/api', syncRoutes);
app.use('/api', academicRoutes);

app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'file_too_large' });
  if (error.name === 'ValidationError') return res.status(400).json({ error: 'validation_error', details: error.message });
  console.error(error);
  return res.status(500).json({ error: 'internal_server_error' });
});

export default app;