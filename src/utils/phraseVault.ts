'use client';

const BACKUP_STORAGE_KEY = 'pinder_wallet_backup';
const PBKDF2_ITERATIONS = 250000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type PhraseBackupPayload = {
  ciphertext: string;
  iv: string;
  salt: string;
  iterations: number;
  createdAt: string;
};

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBuffer = (value: string): ArrayBuffer => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
};

const toArrayBuffer = (view: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(view);
  return copy.buffer as ArrayBuffer;
};

const deriveKey = async (
  password: string,
  salt: ArrayBuffer,
  iterations: number,
  keyUsages: KeyUsage[]
): Promise<CryptoKey> => {
  const passwordBytes = encoder.encode(password);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(passwordBytes),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    keyUsages
  );
};

export const encryptPhrase = async (phrase: string, password: string): Promise<PhraseBackupPayload> => {
  if (!phrase) throw new Error('Missing secret phrase');
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const ivBytes = crypto.getRandomValues(new Uint8Array(12));
  const phraseBytes = encoder.encode(phrase);

  const key = await deriveKey(password, toArrayBuffer(saltBytes), PBKDF2_ITERATIONS, ['encrypt']);
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(ivBytes),
    },
    key,
    toArrayBuffer(phraseBytes)
  );

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(ivBytes.buffer),
    salt: bufferToBase64(saltBytes.buffer),
    iterations: PBKDF2_ITERATIONS,
    createdAt: new Date().toISOString(),
  };
};

export const decryptPhrase = async (payload: PhraseBackupPayload, password: string): Promise<string> => {
  const saltBuffer = base64ToBuffer(payload.salt);
  const ivBuffer = base64ToBuffer(payload.iv);
  const cipherBuffer = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(password, saltBuffer, payload.iterations, ['decrypt']);
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer,
    },
    key,
    cipherBuffer
  );

  return decoder.decode(decryptedBuffer);
};

export const storePhraseBackup = (payload: PhraseBackupPayload) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(payload));
};

export const loadPhraseBackup = (): PhraseBackupPayload | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(BACKUP_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as PhraseBackupPayload;
  } catch (error) {
    console.warn('Invalid phrase backup payload', error);
    return null;
  }
};

export const hasPhraseBackup = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(BACKUP_STORAGE_KEY));
};

export const clearPhraseBackup = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(BACKUP_STORAGE_KEY);
};
