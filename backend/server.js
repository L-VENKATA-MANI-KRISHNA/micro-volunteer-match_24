import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutesV2.js';
import statRoutes from './routes/statRoutesV2.js';

if (!process.env.JWT_SECRET) {
  console.error('Config error: JWT_SECRET is not set. Copy .env.example to .env first.');
  process.exit(1);
}

await connectDB();
const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'https://micro-volunteer-match-24-taupe.vercel.app').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('dev'));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Something went wrong' });
});
app.listen(process.env.PORT || 5001, () => console.log(`API on port ${process.env.PORT || 5001}`));
