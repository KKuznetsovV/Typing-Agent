import { ErrorRequestHandler } from 'express';
import { logError } from '../logger';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (err as { status?: number; statusCode?: number }).status
    ?? (err as { statusCode?: number }).statusCode
    ?? 500;
  const message = (err as { message?: string }).message ?? 'Internal server error';
  logError('Unhandled error', err);
  res.status(status).json({ message });
};
