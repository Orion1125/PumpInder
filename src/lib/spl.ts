'use client';

import {
  Connection,
  PublicKey,
  ParsedAccountData,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { TOKEN_MINTS, TOKEN_DECIMALS, SupportedToken } from '@/constants/tokens';

export interface TokenBalance {
  token: SupportedToken;
  balance: number;
  mintAddress: string;
  ataAddress: string;
}

export class TokenBalanceChecker {
  private connection: Connection;

  constructor(rpcEndpoint: string) {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
  }

  async getTokenBalances(walletPublicKey: string): Promise<TokenBalance[]> {
    const results: TokenBalance[] = [];

    for (const [tokenSymbol, mintAddress] of Object.entries(TOKEN_MINTS)) {
      if (!mintAddress) continue; // Skip tokens without mint addresses (e.g., PINDER if not set)

      try {
        const balance = await this.getTokenBalance(
          walletPublicKey,
          mintAddress,
          tokenSymbol as SupportedToken
        );

        if (balance > 0) {
          const ata = await getAssociatedTokenAddress(
            new PublicKey(mintAddress),
            new PublicKey(walletPublicKey)
          );

          results.push({
            token: tokenSymbol as SupportedToken,
            balance,
            mintAddress,
            ataAddress: ata.toBase58(),
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch balance for ${tokenSymbol}:`, error);
      }
    }

    return results;
  }

  private async getTokenBalance(
    walletPublicKey: string,
    mintAddress: string,
    tokenSymbol: SupportedToken
  ): Promise<number> {
    try {
      const ata = await getAssociatedTokenAddress(
        new PublicKey(mintAddress),
        new PublicKey(walletPublicKey)
      );

      const accountInfo = await this.connection.getAccountInfo(ata);
      
      if (!accountInfo) {
        return 0;
      }

      const parsedInfo = await this.connection.getParsedAccountInfo(ata);
      
      if (
        parsedInfo.value &&
        'parsed' in parsedInfo.value.data &&
        parsedInfo.value.data.program === 'spl-token'
      ) {
        const parsedData = parsedInfo.value.data as ParsedAccountData;
        const amount = parsedData.parsed.info.tokenAmount.amount;
        const decimals = TOKEN_DECIMALS[tokenSymbol];
        return Number(amount) / Math.pow(10, decimals);
      }

      return 0;
    } catch (error) {
      console.error(`Error fetching token balance for ${tokenSymbol}:`, error);
      return 0;
    }
  }

  async findSufficientToken(
    walletPublicKey: string,
    requiredAmount: number
  ): Promise<TokenBalance | null> {
    const balances = await this.getTokenBalances(walletPublicKey);
    
    // Return the first token with sufficient balance
    return balances.find(token => token.balance >= requiredAmount) || null;
  }

  async hasAnyBalance(walletPublicKey: string): Promise<boolean> {
    const balances = await this.getTokenBalances(walletPublicKey);
    return balances.length > 0;
  }
}

// Singleton instance for the app
let tokenBalanceChecker: TokenBalanceChecker | null = null;

export function getTokenBalanceChecker(rpcEndpoint?: string): TokenBalanceChecker {
  if (!tokenBalanceChecker) {
    const endpoint = rpcEndpoint || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    tokenBalanceChecker = new TokenBalanceChecker(endpoint);
  }
  return tokenBalanceChecker;
}
