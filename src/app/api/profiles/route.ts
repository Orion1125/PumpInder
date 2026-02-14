import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/schema';
import { ensureProxyWallet } from '@/lib/proxyWallets';
import { eq } from 'drizzle-orm';

// POST /api/profiles — create a new profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletPublicKey, handle, birthday, gender, interests, photos, bio, location, occupation } = body;

    if (!walletPublicKey || !handle || !birthday || !gender) {
      return NextResponse.json(
        { error: 'walletPublicKey, handle, birthday, and gender are required' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.walletPublicKey, walletPublicKey))
      .limit(1);

    if (existing.length > 0) {
      await ensureProxyWallet(walletPublicKey);
      return NextResponse.json({ profile: existing[0], existing: true }, { status: 200 });
    }

    const inserted = await db
      .insert(profiles)
      .values({
        walletPublicKey,
        handle,
        birthday,
        gender,
        interests: interests || [],
        photos: photos || [],
        bio: bio || '',
        location: location || '',
        occupation: occupation || '',
      })
      .returning();

    await ensureProxyWallet(walletPublicKey);

    return NextResponse.json({ profile: inserted[0], existing: false }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create profile error:', error);

    // Handle unique constraint violation
    const errMsg = error instanceof Error ? error.message : '';
    if (errMsg.includes('duplicate') || errMsg.includes('unique')) {
      return NextResponse.json(
        { error: 'Profile with this wallet or handle already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
