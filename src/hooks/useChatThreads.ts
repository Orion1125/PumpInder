'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';

export interface ChatMessage {
  id: string;
  sender: 'you' | 'match';
  content: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'read';
}

export interface ChatThread {
  id: string;
  matchId: string;
  matchName: string;
  matchAvatar: string;
  matchWallet: string;
  lastActive: string;
  unseenCount: number;
  messages: ChatMessage[];
}

type UseChatThreadsOptions = {
  initialThreadId?: string;
};

export function useChatThreads(options: UseChatThreadsOptions = {}) {
  const { initialThreadId } = options;
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { publicKey, isConnected } = useWallet();

  const loadThreads = useCallback(async () => {
    if (!publicKey || !isConnected) {
      setThreads([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/chat/threads?wallet=${publicKey}`);
      if (!res.ok) throw new Error('Failed to load threads');
      const data = await res.json();
      const mapped: ChatThread[] = (data.threads || []).map((t: ChatThread) => ({
        ...t,
        unseenCount: 0,
      }));
      setThreads(mapped);
    } catch (error) {
      console.error('Error loading chat threads:', error);
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, isConnected]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const resolvedInitialThreadId = useMemo(() => {
    if (initialThreadId) {
      const target = threads.find((thread) => thread.id === initialThreadId);
      if (target) return target.id;
    }
    return threads[0]?.id ?? null;
  }, [initialThreadId, threads]);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(resolvedInitialThreadId);

  // Update activeThreadId when resolvedInitialThreadId changes
  useEffect(() => {
    if (resolvedInitialThreadId && !activeThreadId) {
      setActiveThreadId(resolvedInitialThreadId);
    }
  }, [resolvedInitialThreadId, activeThreadId]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) || null,
    [threads, activeThreadId]
  );

  const selectThread = (threadId: string) => {
    if (threadId === activeThreadId) return;
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId ? { ...thread, unseenCount: 0 } : thread
      )
    );
    setActiveThreadId(threadId);
  };

  const createThread = async (otherWallet: string): Promise<ChatThread | null> => {
    if (!publicKey) return null;

    try {
      const res = await fetch('/api/chat/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletA: publicKey, walletB: otherWallet }),
      });

      if (!res.ok) throw new Error('Failed to create thread');
      const data = await res.json();
      const thread: ChatThread = {
        ...data.thread,
        unseenCount: 0,
      };

      // Add thread to state if not already present
      setThreads((prev) => {
        const exists = prev.find((t) => t.id === thread.id);
        if (exists) return prev;
        return [thread, ...prev];
      });

      setActiveThreadId(thread.id);
      return thread;
    } catch (error) {
      console.error('Error creating thread:', error);
      return null;
    }
  };

  const sendMessage = async (content: string) => {
    if (!activeThread || !publicKey) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: ChatMessage = {
      id: tempId,
      sender: 'you',
      content,
      timestamp: new Date().toISOString(),
      status: 'sending',
    };

    // Optimistically add message
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              messages: [...thread.messages, newMessage],
              lastActive: new Date().toISOString(),
            }
          : thread
      )
    );

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThread.id,
          senderWallet: publicKey,
          content,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();

      // Update temp message with real data
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === activeThread.id
            ? {
                ...thread,
                messages: thread.messages.map((msg) =>
                  msg.id === tempId
                    ? { ...msg, id: data.message.id, status: 'sent' as const }
                    : msg
                ),
              }
            : thread
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove failed message
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === activeThread.id
            ? {
                ...thread,
                messages: thread.messages.filter((msg) => msg.id !== tempId),
              }
            : thread
        )
      );
    }
  };

  return {
    threads,
    activeThread,
    activeThreadId,
    selectThread,
    createThread,
    sendMessage,
    isLoading,
  };
}
