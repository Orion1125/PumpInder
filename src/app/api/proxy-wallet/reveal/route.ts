import { NextRequest, NextResponse } from 'next/server';
import { decryptProxyPrivateKey, ensureProxyWallet, validateRevealMessage, verifyWalletSignature } from '@/lib/proxyWallets';

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

    if (!Array.isArray(signature) || signature.some((part) => typeof part !== 'number')) {
      return NextResponse.json({ error: 'signature must be a number array' }, { status: 400 });
    }

    const isMessageValid = validateRevealMessage(message, walletPublicKey);
    if (!isMessageValid) {
      return NextResponse.json({ error: 'Message expired or invalid' }, { status: 401 });
    }

    const isSignatureValid = verifyWalletSignature(walletPublicKey, message, signature);
    if (!isSignatureValid) {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }

    const proxyWallet = await ensureProxyWallet(walletPublicKey);

    return NextResponse.json(
      {
        proxyPublicKey: proxyWallet.proxyPublicKey,
        proxyPrivateKey: decryptProxyPrivateKey(proxyWallet.proxyPrivateKey),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  } catch (error) {
    console.error('Proxy wallet reveal error:', error);
    return NextResponse.json({ error: 'Failed to reveal proxy wallet key' }, { status: 500 });
  }
}
