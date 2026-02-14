import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import bs58 from 'bs58';
import {
  decryptProxyPrivateKey,
  ensureProxyWallet,
  validateRevealMessage,
  verifyWalletSignature,
} from '@/lib/proxyWallets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const walletPublicKey = body?.walletPublicKey;
    const message = body?.message;
    const signature = body?.signature;

    if (!walletPublicKey || typeof walletPublicKey !== 'string') {
      return NextResponse.json({ error: 'walletPublicKey is required' }, { status: 400 });
    }
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    if (!Array.isArray(signature) || signature.some((s) => typeof s !== 'number')) {
      return NextResponse.json({ error: 'signature must be a number array' }, { status: 400 });
    }

    // Verify the signed message
    const isMessageValid = validateRevealMessage(message, walletPublicKey);
    if (!isMessageValid) {
      return NextResponse.json({ error: 'Message expired or invalid' }, { status: 401 });
    }

    const isSignatureValid = verifyWalletSignature(walletPublicKey, message, signature);
    if (!isSignatureValid) {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }

    // Get proxy wallet
    const proxyRow = await ensureProxyWallet(walletPublicKey);
    const senderSecret = decryptProxyPrivateKey(proxyRow.proxyPrivateKey);
    const sender = Keypair.fromSecretKey(bs58.decode(senderSecret));

    const endpoint =
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
    const connection = new Connection(endpoint, 'confirmed');

    // Get proxy balance
    const balance = await connection.getBalance(sender.publicKey);

    // Estimate fee (5000 lamports is standard)
    const fee = 5000;
    const withdrawable = balance - fee;

    if (withdrawable <= 0) {
      return NextResponse.json(
        { error: 'Proxy wallet balance too low to withdraw (need to cover transaction fee)' },
        { status: 400 },
      );
    }

    // Send entire withdrawable amount to user's main wallet
    const recipient = new PublicKey(walletPublicKey);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: recipient,
        lamports: withdrawable,
      }),
    );

    const txSignature = await sendAndConfirmTransaction(connection, transaction, [sender], {
      commitment: 'confirmed',
      maxRetries: 3,
    });

    return NextResponse.json({
      success: true,
      signature: txSignature,
      amountSol: withdrawable / LAMPORTS_PER_SOL,
      fromProxy: proxyRow.proxyPublicKey,
      toWallet: walletPublicKey,
    });
  } catch (error) {
    console.error('Proxy wallet withdraw error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Withdraw failed' },
      { status: 500 },
    );
  }
}
