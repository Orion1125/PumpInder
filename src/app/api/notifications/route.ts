import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatMessages, chatThreads, swipes, matches, profiles } from '@/lib/schema';
import { eq, or, and, ne, desc } from 'drizzle-orm';
import { decryptMessage } from '@/lib/chatEncryption';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface NotificationItem {
  id: string;
  type: 'message' | 'like' | 'superlike' | 'match';
  fromWallet: string;
  fromHandle: string;
  fromAvatar: string;
  preview: string;
  threadId?: string;
  createdAt: string;
  read: boolean;
}

// GET /api/notifications?wallet=xxx
export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get('wallet');
    if (!wallet) {
      return NextResponse.json({ error: 'wallet query param required' }, { status: 400 });
    }

    const notifications: NotificationItem[] = [];

    // 1) Unread messages from other users (messages in threads where user is a participant, sent by others)
    const userThreads = await db
      .select()
      .from(chatThreads)
      .where(
        or(
          eq(chatThreads.walletA, wallet),
          eq(chatThreads.walletB, wallet)
        )
      );

    if (userThreads.length > 0) {
      await Promise.all(
        userThreads.map(async (thread) => {
          // Get messages from the other person (not sent by current user)
          const otherMessages = await db
            .select()
            .from(chatMessages)
            .where(
              and(
                eq(chatMessages.threadId, thread.id),
                ne(chatMessages.senderWallet, wallet)
              )
            )
            .orderBy(desc(chatMessages.createdAt))
            .limit(5);

          if (otherMessages.length === 0) return;

          // Get the sender's profile
          const senderWallet = otherMessages[0].senderWallet;
          const senderProfile = await db
            .select()
            .from(profiles)
            .where(eq(profiles.walletPublicKey, senderWallet))
            .limit(1);

          const profile = senderProfile[0] || null;
          const photos = (profile?.photos as string[]) || [];

          for (const msg of otherMessages) {
            let decrypted = '';
            try {
              decrypted = decryptMessage(msg.content);
            } catch {
              decrypted = '[encrypted message]';
            }

            notifications.push({
              id: `msg-${msg.id}`,
              type: 'message',
              fromWallet: msg.senderWallet,
              fromHandle: profile?.handle || msg.senderWallet.slice(0, 8),
              fromAvatar: photos[0] || '',
              preview: decrypted.length > 60 ? decrypted.slice(0, 60) + '…' : decrypted,
              threadId: thread.id,
              createdAt: msg.createdAt.toISOString(),
              read: msg.status === 'read',
            });
          }
        })
      );
    }

    // 2) Likes and superlikes received (other people who swiped right/superlike on the user)
    const receivedSwipes = await db
      .select()
      .from(swipes)
      .where(
        and(
          eq(swipes.swipedWallet, wallet),
          or(eq(swipes.direction, 'right'), eq(swipes.direction, 'superlike'))
        )
      )
      .orderBy(desc(swipes.createdAt))
      .limit(10);

    if (receivedSwipes.length > 0) {
      await Promise.all(
        receivedSwipes.map(async (swipe) => {
          const senderProfile = await db
            .select()
            .from(profiles)
            .where(eq(profiles.walletPublicKey, swipe.swiperWallet))
            .limit(1);

          const profile = senderProfile[0] || null;
          const photos = (profile?.photos as string[]) || [];

          notifications.push({
            id: `swipe-${swipe.id}`,
            type: swipe.direction === 'superlike' ? 'superlike' : 'like',
            fromWallet: swipe.swiperWallet,
            fromHandle: profile?.handle || swipe.swiperWallet.slice(0, 8),
            fromAvatar: photos[0] || '',
            preview: swipe.direction === 'superlike'
              ? `${profile?.handle || 'Someone'} superliked you!`
              : `${profile?.handle || 'Someone'} liked you!`,
            createdAt: swipe.createdAt.toISOString(),
            read: false,
          });
        })
      );
    }

    // 3) Matches
    const userMatches = await db
      .select()
      .from(matches)
      .where(or(eq(matches.walletA, wallet), eq(matches.walletB, wallet)))
      .orderBy(desc(matches.createdAt))
      .limit(10);

    if (userMatches.length > 0) {
      await Promise.all(
        userMatches.map(async (match) => {
          const otherWallet = match.walletA === wallet ? match.walletB : match.walletA;
          const otherProfile = await db
            .select()
            .from(profiles)
            .where(eq(profiles.walletPublicKey, otherWallet))
            .limit(1);

          const profile = otherProfile[0] || null;
          const photos = (profile?.photos as string[]) || [];

          notifications.push({
            id: `match-${match.id}`,
            type: 'match',
            fromWallet: otherWallet,
            fromHandle: profile?.handle || otherWallet.slice(0, 8),
            fromAvatar: photos[0] || '',
            preview: `You matched with ${profile?.handle || 'someone'}!`,
            createdAt: match.createdAt.toISOString(),
            read: false,
          });
        })
      );
    }

    // Sort all notifications by date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Limit to most recent 20
    const trimmed = notifications.slice(0, 20);

    return NextResponse.json({
      notifications: trimmed,
      unreadCount: trimmed.filter((n) => !n.read).length,
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
