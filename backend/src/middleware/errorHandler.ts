import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  status?: number;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;
  const message = status === 500 ? 'Internal Server Error' : err.message;

  if (status === 500) {
    console.error('[ErrorHandler]', err);
  }

  res.status(status).json({ error: message });
}
