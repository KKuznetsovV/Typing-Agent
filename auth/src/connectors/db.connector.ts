import mongoose from 'mongoose';
import { appConfig } from '../config';
import { logger } from '../logger';

export async function connectDB(): Promise<void> {
  await mongoose.connect(appConfig.mongoUri);
  logger.info('MongoDB connected');
}
