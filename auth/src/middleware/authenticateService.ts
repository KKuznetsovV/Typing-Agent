import { Request, Response, NextFunction } from 'express';
import { appConfig } from '../config';
import { verifyServiceAuth } from '../utils/serviceAuth';

const SERVICE_NONCE_HEADER = 'x-service-nonce';

export function authenticateService(req: Request, res: Response, next: NextFunction): void {
  const secret = appConfig.serviceAuth.secret;
  if (!secret) {
    res.status(500).json({ message: 'Service authentication is not configured' });
    return;
  }

  const nonce = req.header(SERVICE_NONCE_HEADER);
  const authHeader = req.headers.authorization;

  if (!nonce || !authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const signature = authHeader.slice('Bearer '.length).trim();
  if (!verifyServiceAuth(nonce, signature, secret)) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  next();
}
