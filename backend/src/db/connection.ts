import mongoose from 'mongoose';
import { appConfig } from '../config';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(appConfig.mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
}
