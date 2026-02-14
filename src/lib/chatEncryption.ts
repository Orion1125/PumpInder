import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_PREFIX = 'chat:v1:';

function getEncryptionKey(): Buffer {
  const rawKey = process.env.PROXY_WALLET_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error('Missing PROXY_WALLET_ENCRYPTION_KEY — required for chat encryption');
  }

  const base64 = Buffer.from(rawKey, 'base64');
  if (base64.length === 32) return base64;

  const hex = Buffer.from(rawKey, 'hex');
  if (hex.length === 32) return hex;

  const utf8 = Buffer.from(rawKey, 'utf8');
  if (utf8.length === 32) return utf8;

  throw new Error('PROXY_WALLET_ENCRYPTION_KEY must decode to 32 bytes');
}

export function isEncryptedMessage(value: string): boolean {
  return value.startsWith(ENCRYPTION_PREFIX);
}

/** Encrypt a plaintext chat message with AES-256-GCM. */
export function encryptMessage(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
}

/** Decrypt an encrypted chat message. Returns the original plaintext. */
export function decryptMessage(stored: string): string {
  if (!isEncryptedMessage(stored)) {
    return stored; // not encrypted — return as-is (legacy messages)
  }

  const payload = stored.slice(ENCRYPTION_PREFIX.length);
  const [ivPart, authTagPart, encryptedPart] = payload.split('.');

  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error('Invalid encrypted message format');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivPart, 'base64');
  const authTag = Buffer.from(authTagPart, 'base64');
  const encrypted = Buffer.from(encryptedPart, 'base64');

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
