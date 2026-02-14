import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { ensureProxyWallet } from '@/lib/proxyWallets';

// POST /api/auth/connect — upsert user by wallet public key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletPublicKey } = body;

    if (!walletPublicKey || typeof walletPublicKey !== 'string') {
      return NextResponse.json({ error: 'walletPublicKey is required' }, { status: 400 });
    }

    // Check if profile exists
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.walletPublicKey, walletPublicKey))
      .limit(1);

    if (existing.length > 0) {
      await ensureProxyWallet(walletPublicKey);
      return NextResponse.json({
        user: existing[0],
        isNew: false,
      });
    }

    // New wallet — return that they need onboarding
    return NextResponse.json({
      user: null,
      isNew: true,
    });
  } catch (error) {
    console.error('Auth connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
