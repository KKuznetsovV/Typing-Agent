import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { appConfig } from '../config';

export interface GitHubWebhookRequest extends Request {
  rawBody?: Buffer;
}

function isValidSignature(rawBody: Buffer, signatureHeader?: string): boolean {
  if (!signatureHeader) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', appConfig.github.webhookSecret)
    .update(rawBody)
    .digest('hex')}`;

  const signatureBuffer = Buffer.from(signatureHeader, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export function captureGitHubWebhookRawBody(req: Request, _res: Response, buf: Buffer): void {
  (req as GitHubWebhookRequest).rawBody = buf;
}

export function verifyGitHubWebhookSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const githubRequest = req as GitHubWebhookRequest;
  const rawBody = githubRequest.rawBody ?? Buffer.from('');
  const signature = req.get('x-hub-signature-256') ?? undefined;

  if (!isValidSignature(rawBody, signature)) {
    res.status(401).json({ error: 'Invalid GitHub webhook signature' });
    return;
  }

  next();
}
