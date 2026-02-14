import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { swipes, matches, profiles } from '@/lib/schema';
import { eq, and, or, notInArray, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/profiles/liked?wallet=xxx — profiles the user swiped right / superlike on
export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'wallet query param required' }, { status: 400 });
    }

    // 1. All wallets the user swiped right / superlike on
    const rightSwipes = await db
      .select({ swipedWallet: swipes.swipedWallet })
      .from(swipes)
      .where(
        and(
          eq(swipes.swiperWallet, wallet),
          or(eq(swipes.direction, 'right'), eq(swipes.direction, 'superlike')),
        ),
      );

    const likedWallets = rightSwipes.map((s) => s.swipedWallet);

    if (likedWallets.length === 0) {
      return NextResponse.json({ profiles: [] });
    }

    // 2. Exclude wallets already matched
    const userMatches = await db
      .select()
      .from(matches)
      .where(or(eq(matches.walletA, wallet), eq(matches.walletB, wallet)));

    const matchedWallets = new Set(
      userMatches.flatMap((m) => [m.walletA, m.walletB]).filter((w) => w !== wallet),
    );

    const likedNotMatched = likedWallets.filter((w) => !matchedWallets.has(w));

    if (likedNotMatched.length === 0) {
      return NextResponse.json({ profiles: [] });
    }

    // 3. Fetch profiles for those wallets
    const likedProfiles = await db
      .select()
      .from(profiles)
      .where(inArray(profiles.walletPublicKey, likedNotMatched));

    return NextResponse.json({ profiles: likedProfiles });
  } catch (error) {
    console.error('Liked profiles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
