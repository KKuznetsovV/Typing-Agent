import crypto from 'crypto';

const HMAC_ALGORITHM = 'sha256';
const SERVICE_NONCE_HEADER = 'x-service-nonce';

function signServiceNonce(nonce: string, secret: string): string {
  return crypto.createHmac(HMAC_ALGORITHM, secret).update(nonce).digest('hex');
}

export function createServiceAuthHeaders(secret: string): Record<string, string> {
  const nonce = crypto.randomUUID();
  const signature = signServiceNonce(nonce, secret);
  return {
    [SERVICE_NONCE_HEADER]: nonce,
    Authorization: `Bearer ${signature}`,
  };
}
