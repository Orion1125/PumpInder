import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, clusterApiUrl, sendAndConfirmTransaction } from '@solana/web3.js';
import { db } from '@/lib/db';
import { proxyWallets } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const REVEAL_MESSAGE_PREFIX = 'Mypinder Proxy Wallet Reveal';
const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000;
const ENCRYPTION_PREFIX = 'enc:v1:';

function getEncryptionKey(): Buffer {
  const rawKey = process.env.PROXY_WALLET_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error('Missing PROXY_WALLET_ENCRYPTION_KEY');
  }

  const base64 = Buffer.from(rawKey, 'base64');
  if (base64.length === 32) return base64;

  const hex = Buffer.from(rawKey, 'hex');
  if (hex.length === 32) return hex;

  const utf8 = Buffer.from(rawKey, 'utf8');
  if (utf8.length === 32) return utf8;

  throw new Error('PROXY_WALLET_ENCRYPTION_KEY must decode to 32 bytes');
}

function isEncryptedPrivateKey(value: string) {
  return value.startsWith(ENCRYPTION_PREFIX);
}

function encryptPrivateKey(plainPrivateKey: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainPrivateKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptProxyPrivateKey(storedPrivateKey: string) {
  if (!isEncryptedPrivateKey(storedPrivateKey)) {
    return storedPrivateKey;
  }

  const payload = storedPrivateKey.slice(ENCRYPTION_PREFIX.length);
  const [ivPart, authTagPart, encryptedPart] = payload.split('.');

  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error('Invalid encrypted private key format');
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

export function generateProxyWalletKeys() {
  const keypair = Keypair.generate();
  return {
    proxyPublicKey: keypair.publicKey.toBase58(),
    proxyPrivateKey: bs58.encode(keypair.secretKey),
  };
}

export async function ensureProxyWallet(walletPublicKey: string) {
  const existing = await db
    .select()
    .from(proxyWallets)
    .where(eq(proxyWallets.walletPublicKey, walletPublicKey))
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];

    if (!isEncryptedPrivateKey(row.proxyPrivateKey)) {
      const encryptedPrivateKey = encryptPrivateKey(row.proxyPrivateKey);
      const updated = await db
        .update(proxyWallets)
        .set({
          proxyPrivateKey: encryptedPrivateKey,
          updatedAt: new Date(),
        })
        .where(eq(proxyWallets.id, row.id))
        .returning();

      return updated[0];
    }

    return row;
  }

  const generated = generateProxyWalletKeys();
  const inserted = await db
    .insert(proxyWallets)
    .values({
      walletPublicKey,
      proxyPublicKey: generated.proxyPublicKey,
      proxyPrivateKey: encryptPrivateKey(generated.proxyPrivateKey),
    })
    .returning();

  return inserted[0];
}

export function createRevealMessage(walletPublicKey: string) {
  const issuedAt = Date.now();
  const nonce = Math.random().toString(36).slice(2, 12);
  return `${REVEAL_MESSAGE_PREFIX}\nWallet: ${walletPublicKey}\nIssuedAt: ${issuedAt}\nNonce: ${nonce}`;
}

export function validateRevealMessage(message: string, walletPublicKey: string) {
  const lines = message.split('\n');
  if (lines.length < 4 || lines[0] !== REVEAL_MESSAGE_PREFIX) {
    return false;
  }

  const walletLine = lines.find((line) => line.startsWith('Wallet: '));
  const issuedAtLine = lines.find((line) => line.startsWith('IssuedAt: '));

  if (!walletLine || !issuedAtLine) {
    return false;
  }

  const messageWallet = walletLine.slice('Wallet: '.length).trim();
  if (messageWallet !== walletPublicKey) {
    return false;
  }

  const issuedAt = Number(issuedAtLine.slice('IssuedAt: '.length).trim());
  if (!Number.isFinite(issuedAt)) {
    return false;
  }

  return Date.now() - issuedAt <= MAX_MESSAGE_AGE_MS;
}

export function verifyWalletSignature(walletPublicKey: string, message: string, signature: number[]) {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = Uint8Array.from(signature);
  const walletBytes = new PublicKey(walletPublicKey).toBytes();
  return nacl.sign.detached.verify(messageBytes, signatureBytes, walletBytes);
}

export async function transferBetweenProxyWallets({
  fromProxyPrivateKey,
  toProxyPublicKey,
  amountSol,
  platformFeeWallet,
  platformFeePercent = 0,
}: {
  fromProxyPrivateKey: string;
  toProxyPublicKey: string;
  amountSol: number;
  /** Optional: public key that receives the platform cut. */
  platformFeeWallet?: string;
  /** Fraction (0 – 1) taken as platform fee. Default 0 (no fee). */
  platformFeePercent?: number;
}) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
  const connection = new Connection(endpoint, 'confirmed');

  const sender = Keypair.fromSecretKey(bs58.decode(fromProxyPrivateKey));
  const recipient = new PublicKey(toProxyPublicKey);
  const totalLamports = Math.floor(amountSol * 1_000_000_000);

  if (totalLamports <= 0) {
    throw new Error('Transfer amount must be greater than zero');
  }

  // Compute fee split
  const feeLamports =
    platformFeeWallet && platformFeePercent > 0
      ? Math.floor(totalLamports * platformFeePercent)
      : 0;
  const recipientLamports = totalLamports - feeLamports;

  const transaction = new Transaction();

  // Recipient gets (100% - fee)
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: recipientLamports,
    }),
  );

  // Platform fee wallet gets fee%
  if (feeLamports > 0 && platformFeeWallet) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: new PublicKey(platformFeeWallet),
        lamports: feeLamports,
      }),
    );
  }

  const signature = await sendAndConfirmTransaction(connection, transaction, [sender], {
    commitment: 'confirmed',
    maxRetries: 3,
  });

  return signature;
}
