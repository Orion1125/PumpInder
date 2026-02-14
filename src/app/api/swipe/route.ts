import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { swipes, matches, chatThreads } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/swipe — record a swipe action, check for match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { swiperWallet, swipedWallet, direction } = body;

    if (!swiperWallet || !swipedWallet || !direction) {
      return NextResponse.json(
        { error: 'swiperWallet, swipedWallet, and direction are required' },
        { status: 400 }
      );
    }

    // Record the swipe
    await db.insert(swipes).values({
      swiperWallet,
      swipedWallet,
      direction,
    });

    let matched = false;
    let matchId: string | null = null;

    // Check for a match (if it was a right swipe or superlike)
    if (direction === 'right' || direction === 'superlike') {
      // Did the other person already swipe right on us?
      const reciprocal = await db
        .select()
        .from(swipes)
        .where(
          and(
            eq(swipes.swiperWallet, swipedWallet),
            eq(swipes.swipedWallet, swiperWallet)
          )
        )
        .limit(1);

      const hasReciprocal = reciprocal.length > 0 && 
        (reciprocal[0].direction === 'right' || reciprocal[0].direction === 'superlike');

      if (hasReciprocal) {
        // Create a match
        const [walletA, walletB] = [swiperWallet, swipedWallet].sort();
        const newMatch = await db
          .insert(matches)
          .values({ walletA, walletB })
          .returning();

        matchId = newMatch[0].id;
        matched = true;

        // Create a chat thread for the match
        await db.insert(chatThreads).values({
          matchId: newMatch[0].id,
        });
      }
    }

    return NextResponse.json({
      recorded: true,
      matched,
      matchId,
    });
  } catch (error) {
    console.error('Swipe error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
