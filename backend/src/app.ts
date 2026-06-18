import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { configurePassport } from './passport';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler } from './middleware/errorHandler';
import { frontendConfig } from './config';

export function createApp(): express.Application {
  const app = express();

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS — allow requests from the React client
  app.use(
    cors({
      origin: frontendConfig.url,
      credentials: true,
    })
  );

  // Passport initialisation (no sessions — JWT only)
  configurePassport();
  app.use(passport.initialize());

  // Mount routers
  app.use('/auth', authRoutes);
  app.use('/api/user', userRoutes);

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Global error handler (must be registered last)
  app.use(errorHandler);

  return app;
}
