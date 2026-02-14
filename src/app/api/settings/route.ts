import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET /api/settings?wallet=<publicKey>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'wallet is required' }, { status: 400 });
    }

    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.walletPublicKey, wallet))
      .limit(1);

    if (!settings) {
      return NextResponse.json({ settings: null });
    }

    return NextResponse.json({
      settings: {
        theme: settings.theme,
        language: settings.language,
        monochromePictures: settings.monochromePictures,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletPublicKey, theme, language, monochromePictures } = body;

    if (!walletPublicKey) {
      return NextResponse.json({ error: 'walletPublicKey is required' }, { status: 400 });
    }

    // Check if settings exist
    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.walletPublicKey, walletPublicKey))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set({
          theme: theme ?? existing.theme,
          language: language ?? existing.language,
          monochromePictures: monochromePictures ?? existing.monochromePictures,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.walletPublicKey, walletPublicKey))
        .returning();

      return NextResponse.json({ settings: updated });
    } else {
      const [created] = await db
        .insert(userSettings)
        .values({
          walletPublicKey,
          theme: theme ?? 'system',
          language: language ?? 'en',
          monochromePictures: monochromePictures ?? false,
        })
        .returning();

      return NextResponse.json({ settings: created }, { status: 201 });
    }
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
