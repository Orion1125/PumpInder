export const PLATFORM_FEE_WALLET = 'CLLqyRY5JjJZR2uNScBW7XmnCxnKjso5hsYhSBQnyQNV' as const;
export const PLATFORM_FEE_PERCENT = 0.10; // 10 %

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

/** Fee amounts expressed in USD – converted to SOL at runtime via useSolPrice. */
export const FEE_AMOUNTS_USD = {
  LIKE: 2,       // $2
  SUPERLIKE: 5,  // $5
  TIP: {
    SMALL: 1,
    MEDIUM: 5,
    LARGE: 10,
  },
} as const;

/** Legacy static SOL amounts (kept as fallback when price unavailable). */
export const FEE_AMOUNTS = {
  LIKE: 0.5,
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
