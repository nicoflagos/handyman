import mongoose from 'mongoose';
import config from '../config';
import { logger } from '../utils/logger';

export async function connectDB(): Promise<void> {
  const uri = config.mongoUri;
  try {
    await mongoose.connect(uri, {
      // useNewUrlParser and useUnifiedTopology are defaults in newer mongoose
    } as mongoose.ConnectOptions);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('MongoDB connection error', err as Error);
    throw err;
  }
}

export default connectDB;
