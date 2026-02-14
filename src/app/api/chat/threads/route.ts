import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatThreads, chatMessages, matches, profiles } from '@/lib/schema';
import { eq, or, and } from 'drizzle-orm';
import { decryptMessage } from '@/lib/chatEncryption';

// POST /api/chat/threads — create a new thread between two wallets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletA, walletB } = body;

    if (!walletA || !walletB) {
      return NextResponse.json({ error: 'walletA and walletB are required' }, { status: 400 });
    }

    if (walletA === walletB) {
      return NextResponse.json({ error: 'Cannot create thread with yourself' }, { status: 400 });
    }

    // Check if a thread already exists between these two wallets
    const existing = await db
      .select()
      .from(chatThreads)
      .where(
        or(
          and(eq(chatThreads.walletA, walletA), eq(chatThreads.walletB, walletB)),
          and(eq(chatThreads.walletA, walletB), eq(chatThreads.walletB, walletA))
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Return existing thread with profile details
      const otherWallet = existing[0].walletA === walletA ? existing[0].walletB! : existing[0].walletA!;
      const otherProfile = await db.select().from(profiles).where(eq(profiles.walletPublicKey, otherWallet)).limit(1);
      const profile = otherProfile[0] || null;
      const photos = (profile?.photos as string[]) || [];

      const messages = await db.select().from(chatMessages).where(eq(chatMessages.threadId, existing[0].id));

      return NextResponse.json({
        thread: {
          id: existing[0].id,
          matchId: existing[0].matchId || '',
          matchName: profile?.handle || otherWallet.slice(0, 8),
          matchAvatar: photos[0] || '',
          matchWallet: otherWallet,
          lastActive: existing[0].updatedAt?.toISOString() || existing[0].createdAt.toISOString(),
          messages: messages.map((msg) => ({
            id: msg.id,
            sender: msg.senderWallet === walletA ? 'you' : 'match',
            content: decryptMessage(msg.content),
            timestamp: msg.createdAt.toISOString(),
            status: msg.status || 'sent',
          })),
        },
        created: false,
      });
    }

    // Also check if there's already a match-based thread via matches table
    const existingMatch = await db
      .select()
      .from(matches)
      .where(
        or(
          and(eq(matches.walletA, walletA), eq(matches.walletB, walletB)),
          and(eq(matches.walletA, walletB), eq(matches.walletB, walletA))
        )
      )
      .limit(1);

    let matchId: string | null = null;
    if (existingMatch.length > 0) {
      matchId = existingMatch[0].id;
      // Check if there's already a thread for this match
      const matchThread = await db.select().from(chatThreads).where(eq(chatThreads.matchId, matchId)).limit(1);
      if (matchThread.length > 0) {
        const otherWallet = existingMatch[0].walletA === walletA ? existingMatch[0].walletB : existingMatch[0].walletA;
        const otherProfile = await db.select().from(profiles).where(eq(profiles.walletPublicKey, otherWallet)).limit(1);
        const profile = otherProfile[0] || null;
        const photos = (profile?.photos as string[]) || [];
        const messages = await db.select().from(chatMessages).where(eq(chatMessages.threadId, matchThread[0].id));

        return NextResponse.json({
          thread: {
            id: matchThread[0].id,
            matchId: matchId,
            matchName: profile?.handle || otherWallet.slice(0, 8),
            matchAvatar: photos[0] || '',
            matchWallet: otherWallet,
            lastActive: matchThread[0].updatedAt?.toISOString() || matchThread[0].createdAt.toISOString(),
            messages: messages.map((msg) => ({
              id: msg.id,
              sender: msg.senderWallet === walletA ? 'you' : 'match',
              content: decryptMessage(msg.content),
              timestamp: msg.createdAt.toISOString(),
              status: msg.status || 'sent',
            })),
          },
          created: false,
        });
      }
    }

    // Create new thread
    const inserted = await db
      .insert(chatThreads)
      .values({
        matchId: matchId,
        walletA: walletA,
        walletB: walletB,
      })
      .returning();

    // Get the other person's profile
    const otherProfile = await db.select().from(profiles).where(eq(profiles.walletPublicKey, walletB)).limit(1);
    const profile = otherProfile[0] || null;
    const photos = (profile?.photos as string[]) || [];

    return NextResponse.json({
      thread: {
        id: inserted[0].id,
        matchId: matchId || '',
        matchName: profile?.handle || walletB.slice(0, 8),
        matchAvatar: photos[0] || '',
        matchWallet: walletB,
        lastActive: inserted[0].createdAt.toISOString(),
        messages: [],
      },
      created: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Create chat thread error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/chat/threads?wallet=xxx — get all chat threads for a wallet
export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'wallet query param required' }, { status: 400 });
    }

    const allThreads: Array<{
      id: string;
      matchId: string;
      matchName: string;
      matchAvatar: string;
      matchWallet: string;
      lastActive: string;
      messages: Array<{
        id: string;
        sender: string;
        content: string;
        timestamp: string;
        status: string;
      }>;
    }> = [];

    const seenThreadIds = new Set<string>();

    // 1) Find all match-based threads
    const userMatches = await db
      .select()
      .from(matches)
      .where(or(eq(matches.walletA, wallet), eq(matches.walletB, wallet)));

    await Promise.all(
      userMatches.map(async (match) => {
        const otherWallet = match.walletA === wallet ? match.walletB : match.walletA;

        const otherProfile = await db
          .select()
          .from(profiles)
          .where(eq(profiles.walletPublicKey, otherWallet))
          .limit(1);

        const thread = await db
          .select()
          .from(chatThreads)
          .where(eq(chatThreads.matchId, match.id))
          .limit(1);

        if (thread.length === 0) return;
        seenThreadIds.add(thread[0].id);

        const messages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.threadId, thread[0].id));

        const profile = otherProfile[0] || null;
        const photos = (profile?.photos as string[]) || [];

        allThreads.push({
          id: thread[0].id,
          matchId: match.id,
          matchName: profile?.handle || otherWallet.slice(0, 8),
          matchAvatar: photos[0] || '',
          matchWallet: otherWallet,
          lastActive: thread[0].updatedAt?.toISOString() || thread[0].createdAt.toISOString(),
          messages: messages.map((msg) => ({
            id: msg.id,
            sender: msg.senderWallet === wallet ? 'you' : 'match',
            content: decryptMessage(msg.content),
            timestamp: msg.createdAt.toISOString(),
            status: msg.status || 'sent',
          })),
        });
      })
    );

    // 2) Find all direct threads (walletA/walletB based, no match required)
    const directThreads = await db
      .select()
      .from(chatThreads)
      .where(
        or(
          eq(chatThreads.walletA, wallet),
          eq(chatThreads.walletB, wallet)
        )
      );

    await Promise.all(
      directThreads
        .filter((t) => !seenThreadIds.has(t.id))
        .map(async (thread) => {
          const otherWallet = thread.walletA === wallet ? thread.walletB! : thread.walletA!;

          const otherProfile = await db
            .select()
            .from(profiles)
            .where(eq(profiles.walletPublicKey, otherWallet))
            .limit(1);

          const messages = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.threadId, thread.id));

          const profile = otherProfile[0] || null;
          const photos = (profile?.photos as string[]) || [];

          allThreads.push({
            id: thread.id,
            matchId: thread.matchId || '',
            matchName: profile?.handle || otherWallet.slice(0, 8),
            matchAvatar: photos[0] || '',
            matchWallet: otherWallet,
            lastActive: thread.updatedAt?.toISOString() || thread.createdAt.toISOString(),
            messages: messages.map((msg) => ({
              id: msg.id,
              sender: msg.senderWallet === wallet ? 'you' : 'match',
              content: decryptMessage(msg.content),
              timestamp: msg.createdAt.toISOString(),
              status: msg.status || 'sent',
            })),
          });
        })
    );

    return NextResponse.json({ threads: allThreads });
  } catch (error) {
    console.error('Get chat threads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
