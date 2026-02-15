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

/** Legacy static SOL amounts (kept as fallback when price unavailable). Updated for ~$200 SOL price. */
export const FEE_AMOUNTS = {
  LIKE: 0.01,      // ~$2 at $200/SOL
  SUPERLIKE: 0.025, // ~$5 at $200/SOL
  TIP: {
    SMALL: 0.005,  // ~$1 at $200/SOL
    MEDIUM: 0.025, // ~$5 at $200/SOL
    LARGE: 0.05,   // ~$10 at $200/SOL
  },
} as const;

export const TOKEN_SYMBOLS = {
  USDC: 'USDC',
  USDT: 'USDT',
  PINDER: 'PINDER',
} as const;
