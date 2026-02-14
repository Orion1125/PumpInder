import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatMessages, chatThreads } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { encryptMessage } from '@/lib/chatEncryption';

// POST /api/chat/messages — send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { threadId, senderWallet, content } = body;

    if (!threadId || !senderWallet || !content) {
      return NextResponse.json(
        { error: 'threadId, senderWallet, and content are required' },
        { status: 400 }
      );
    }

    // Encrypt message content at rest
    const encryptedContent = encryptMessage(content);

    // Insert the message
    const inserted = await db
      .insert(chatMessages)
      .values({
        threadId,
        senderWallet,
        content: encryptedContent,
        status: 'sent',
      })
      .returning();

    // Update the thread's updatedAt
    await db
      .update(chatThreads)
      .set({ updatedAt: new Date() })
      .where(eq(chatThreads.id, threadId));

    return NextResponse.json({ message: inserted[0] }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
