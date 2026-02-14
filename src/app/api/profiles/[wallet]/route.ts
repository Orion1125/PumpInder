import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/profiles/[wallet] — fetch profile by wallet public key
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;

    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.walletPublicKey, wallet))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: result[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/profiles/[wallet] — update profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const body = await request.json();

    const updated = await db
      .update(profiles)
      .set({
        ...(body.handle !== undefined && { handle: body.handle }),
        ...(body.birthday !== undefined && { birthday: body.birthday }),
        ...(body.gender !== undefined && { gender: body.gender }),
        ...(body.interests !== undefined && { interests: body.interests }),
        ...(body.photos !== undefined && { photos: body.photos }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.occupation !== undefined && { occupation: body.occupation }),
        ...(body.pronouns !== undefined && { pronouns: body.pronouns }),
        ...(body.socialHandles !== undefined && { socialHandles: body.socialHandles }),
        ...(body.favoriteTokens !== undefined && { favoriteTokens: body.favoriteTokens }),
        ...(body.bestExperience !== undefined && { bestExperience: body.bestExperience }),
        ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
        ...(body.company !== undefined && { company: body.company }),
        ...(body.industry !== undefined && { industry: body.industry }),
        ...(body.experience !== undefined && { experience: body.experience }),
        updatedAt: new Date(),
      })
      .where(eq(profiles.walletPublicKey, wallet))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: updated[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
