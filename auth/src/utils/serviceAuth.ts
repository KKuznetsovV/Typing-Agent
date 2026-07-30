import crypto from 'crypto';

const HMAC_ALGORITHM = 'sha256';

export function signServiceNonce(nonce: string, secret: string): string {
  return crypto.createHmac(HMAC_ALGORITHM, secret).update(nonce).digest('hex');
}

export function verifyServiceAuth(nonce: string, signature: string, secret: string): boolean {
  if (!nonce || !signature || !secret) return false;

  const expected = signServiceNonce(nonce, secret);
  if (expected.length !== signature.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
