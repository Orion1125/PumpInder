import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles, swipes } from '@/lib/schema';
import { eq, and, ne, notInArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/profiles/discover?wallet=xxx — get swipe candidates (excluding self and already-swiped)
export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'wallet query param required' }, { status: 400 });
    }

    // Find wallets already swiped by this user
    const alreadySwiped = await db
      .select({ swipedWallet: swipes.swipedWallet })
      .from(swipes)
      .where(eq(swipes.swiperWallet, wallet));

    const swipedWallets = alreadySwiped.map((s) => s.swipedWallet);

    // Fetch ALL candidates excluding self and already-swiped (no limit)
    let candidates;
    if (swipedWallets.length > 0) {
      candidates = await db
        .select()
        .from(profiles)
        .where(
          and(
            ne(profiles.walletPublicKey, wallet),
            notInArray(profiles.walletPublicKey, swipedWallets)
          )
        );
    } else {
      candidates = await db
        .select()
        .from(profiles)
        .where(ne(profiles.walletPublicKey, wallet));
    }

    return NextResponse.json({ profiles: candidates });
  } catch (error) {
    console.error('Discover profiles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
