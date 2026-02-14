import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { proxyWallets } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { decryptProxyPrivateKey, ensureProxyWallet, transferBetweenProxyWallets } from '@/lib/proxyWallets';
import { PLATFORM_FEE_WALLET, PLATFORM_FEE_PERCENT } from '@/constants/tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fromWalletPublicKey = body?.fromWalletPublicKey;
    const toWalletPublicKey = body?.toWalletPublicKey;
    const amountSol = Number(body?.amountSol);
    const actionType = body?.actionType;

    if (!fromWalletPublicKey || !toWalletPublicKey || !actionType) {
      return NextResponse.json({ error: 'fromWalletPublicKey, toWalletPublicKey and actionType are required' }, { status: 400 });
    }

    if (!Number.isFinite(amountSol) || amountSol <= 0) {
      return NextResponse.json({ error: 'amountSol must be greater than zero' }, { status: 400 });
    }

    const senderProxy = await ensureProxyWallet(fromWalletPublicKey);
    const receiverProxy = await ensureProxyWallet(toWalletPublicKey);

    const signature = await transferBetweenProxyWallets({
      fromProxyPrivateKey: decryptProxyPrivateKey(senderProxy.proxyPrivateKey),
      toProxyPublicKey: receiverProxy.proxyPublicKey,
      amountSol,
      platformFeeWallet: PLATFORM_FEE_WALLET,
      platformFeePercent: PLATFORM_FEE_PERCENT,
    });

    await db
      .update(proxyWallets)
      .set({ updatedAt: new Date() })
      .where(
        and(
          eq(proxyWallets.walletPublicKey, fromWalletPublicKey),
          eq(proxyWallets.proxyPublicKey, senderProxy.proxyPublicKey),
        ),
      );

    return NextResponse.json({
      success: true,
      signature,
      fromProxyWallet: senderProxy.proxyPublicKey,
      toProxyWallet: receiverProxy.proxyPublicKey,
      amountSol,
      actionType,
    });
  } catch (error) {
    console.error('Proxy wallet transfer error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Proxy transfer failed',
      },
      { status: 500 },
    );
  }
}
