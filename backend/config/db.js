import mongoose from 'mongoose';

export default async function connectDB() {
  if (!process.env.MONGODB_URI) {
    console.error('Database error: MONGODB_URI is not set. Copy .env.example to .env first.');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error(`Database error: ${error.message}`);
    process.exit(1);
  }
}
