import mongoose from 'mongoose';
import { createApp } from './app';
import { serverConfig, mongodbConfig } from './config';

// Import global type augmentations
import './types/global.d';

async function main(): Promise<void> {
  await mongoose.connect(mongodbConfig.uri);
  console.log('Connected to MongoDB');

  const app = createApp();
  const port = serverConfig.port;

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
