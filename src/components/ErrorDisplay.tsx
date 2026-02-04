'use client';

import { AlertCircle, X } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
  variant?: 'inline' | 'modal';
}

export function ErrorDisplay({ error, onDismiss, variant = 'inline' }: ErrorDisplayProps) {
  if (!error) return null;

  const baseClasses = "flex items-start gap-3 p-4 rounded-lg border";
  const variantClasses = variant === 'modal' 
    ? "bg-red-50 border-red-200"
    : "bg-red-50/80 border-red-200 backdrop-blur-sm";

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-800 text-sm font-medium">Error</p>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-100"
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// Common error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Wallet not connected. Please connect your wallet to continue.',
  INSUFFICIENT_BALANCE: 'Insufficient balance. Please add funds to your wallet to continue.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TOKEN_NOT_SUPPORTED: 'Token not supported. Please use USDC, USDT, or PINDER.',
  WALLET_ERROR: 'Wallet error. Please make sure your wallet is properly configured.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
