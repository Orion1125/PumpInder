'use client';

import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { SERVICE_FEE_WALLET, TOKEN_MINTS, TOKEN_DECIMALS, SupportedToken } from '@/constants/tokens';
import { TokenBalance } from './spl';

export interface PaymentRequest {
  amount: number;
  token: SupportedToken;
  userKeypair: Keypair;
}

export interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
  tokenUsed: SupportedToken;
  amountPaid: number;
}

export class TokenPaymentService {
  private connection: Connection;

  constructor(rpcEndpoint: string) {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
  }

  async payServiceFee(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const { amount, token, userKeypair } = request;
      const mintAddress = TOKEN_MINTS[token];
      
      if (!mintAddress) {
        throw new Error(`Token ${token} is not supported`);
      }

      const decimals = TOKEN_DECIMALS[token];
      const adjustedAmount = Math.floor(amount * Math.pow(10, decimals));

      const transaction = new Transaction();
      const userPublicKey = userKeypair.publicKey;
      const serviceFeePublicKey = new PublicKey(SERVICE_FEE_WALLET);
      const mintPublicKey = new PublicKey(mintAddress);

      // Get user's associated token account
      const userATA = await getAssociatedTokenAddress(
        mintPublicKey,
        userPublicKey
      );

      // Get service fee wallet's associated token account
      const serviceFeeATA = await getAssociatedTokenAddress(
        mintPublicKey,
        serviceFeePublicKey
      );

      // Check if user's ATA exists, if not add instruction to create it
      const userATAInfo = await this.connection.getAccountInfo(userATA);
      if (!userATAInfo) {
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          userPublicKey, // payer
          userATA, // ata
          userPublicKey, // owner
          mintPublicKey // mint
        );
        transaction.add(createATAInstruction);
      }

      // Check if service fee ATA exists, if not add instruction to create it
      const serviceFeeATAInfo = await this.connection.getAccountInfo(serviceFeeATA);
      if (!serviceFeeATAInfo) {
        const createServiceFeeATAInstruction = createAssociatedTokenAccountInstruction(
          userPublicKey, // payer
          serviceFeeATA, // ata
          serviceFeePublicKey, // owner
          mintPublicKey // mint
        );
        transaction.add(createServiceFeeATAInstruction);
      }

      // Add transfer instruction
      const transferInstruction = createTransferInstruction(
        userATA, // from
        serviceFeeATA, // to
        userPublicKey, // owner
        adjustedAmount // amount
      );
      transaction.add(transferInstruction);

      // Get recent blockhash and set fee payer
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [userKeypair],
        {
          commitment: 'confirmed',
          maxRetries: 3,
        }
      );

      return {
        success: true,
        signature,
        tokenUsed: token,
        amountPaid: amount,
      };
    } catch (error) {
      console.error('Payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        tokenUsed: request.token,
        amountPaid: request.amount,
      };
    }
  }

  async simulatePayment(request: PaymentRequest): Promise<{
    canPay: boolean;
    estimatedFee: number;
    requiresATA: boolean;
  }> {
    try {
      const { token, userKeypair } = request;
      const mintAddress = TOKEN_MINTS[token];
      
      if (!mintAddress) {
        return { canPay: false, estimatedFee: 0, requiresATA: false };
      }

      const userPublicKey = userKeypair.publicKey;
      const mintPublicKey = new PublicKey(mintAddress);
      const userATA = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);
      
      const userATAInfo = await this.connection.getAccountInfo(userATA);
      const requiresATA = !userATAInfo;

      // Estimate transaction fee (in lamports)
      const estimatedFee = requiresATA ? 0.003 : 0.001; // Rough estimate in SOL

      return {
        canPay: true,
        estimatedFee,
        requiresATA,
      };
    } catch (error) {
      console.error('Simulation failed:', error);
      return { canPay: false, estimatedFee: 0, requiresATA: false };
    }
  }
}

// Singleton instance
let paymentService: TokenPaymentService | null = null;

export function getPaymentService(rpcEndpoint?: string): TokenPaymentService {
  if (!paymentService) {
    const endpoint = rpcEndpoint || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    paymentService = new TokenPaymentService(endpoint);
  }
  return paymentService;
}

// Helper function to create payment request from token balance
export function createPaymentRequest(
  balance: TokenBalance,
  amount: number,
  userKeypair: Keypair
): PaymentRequest {
  return {
    amount,
    token: balance.token,
    userKeypair,
  };
}
