import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { appConfig } from '../config';

function isValidSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', appConfig.github.webhookSecret)
    .update(rawBody)
    .digest('hex')}`;

  const sigBuffer = Buffer.from(signatureHeader, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (sigBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export function verifyGithubWebhook(req: Request, res: Response, next: NextFunction): void {
  const rawBody = req.body as Buffer;
  const signature = req.get('x-hub-signature-256');

  if (!isValidSignature(rawBody, signature)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  next();
}
