import { NextRequest, NextResponse } from 'next/server';
import { ensureProxyWallet, createRevealMessage } from '@/lib/proxyWallets';

// GET /api/proxy-wallet?wallet=xxx -> fetch proxy public key
export async function GET(request: NextRequest) {
  try {
    const walletPublicKey = request.nextUrl.searchParams.get('wallet');
    if (!walletPublicKey) {
      return NextResponse.json({ error: 'wallet query param is required' }, { status: 400 });
    }

    const proxyWallet = await ensureProxyWallet(walletPublicKey);
    return NextResponse.json({ proxyPublicKey: proxyWallet.proxyPublicKey });
  } catch (error) {
    console.error('Proxy wallet GET error:', error);
    return NextResponse.json({ error: 'Failed to load proxy wallet' }, { status: 500 });
  }
}

// POST /api/proxy-wallet -> create one-time message for ownership proof
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const walletPublicKey = body?.walletPublicKey;

    if (!walletPublicKey || typeof walletPublicKey !== 'string') {
      return NextResponse.json({ error: 'walletPublicKey is required' }, { status: 400 });
    }

    return NextResponse.json({
      message: createRevealMessage(walletPublicKey),
    });
  } catch (error) {
    console.error('Proxy wallet challenge error:', error);
    return NextResponse.json({ error: 'Failed to create challenge message' }, { status: 500 });
  }
}
