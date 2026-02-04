export const SERVICE_FEE_WALLET = '8WaYVh1TgZhf3gNhx57GpxDU77paM1YZTxZ1QQyUuU6p' as const;

export const TOKEN_MINTS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC (Solana)
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT (Solana)
  PINDER: '', // TODO: Add $PINDER mint address when available
} as const;

export const TOKEN_DECIMALS = {
  USDC: 6,
  USDT: 6,
  PINDER: 9, // Assume 9 decimals for PINDER (common for SPL tokens)
} as const;

export type SupportedToken = keyof typeof TOKEN_MINTS;

export const FEE_AMOUNTS = {
  LIKE: 0.5, // in USDC equivalent
  SUPERLIKE: 2.0,
  TIP: {
    SMALL: 1.0,
    MEDIUM: 5.0,
    LARGE: 10.0,
  },
} as const;

export const TOKEN_SYMBOLS = {
  USDC: 'USDC',
  USDT: 'USDT',
  PINDER: 'PINDER',
} as const;
