import { useEffect, useMemo, useState } from 'react';
import { ChatMessage, ChatThread } from '@/types';

const mockThreads: ChatThread[] = [
  {
    id: 1,
    matchId: 1,
    matchName: 'Celeste',
    matchAvatar: 'https://picsum.photos/seed/celeste/200/200',
    lastActive: '2m ago',
    unseenCount: 0,
    messages: [
      {
        id: 1,
        sender: 'match',
        content: 'Totally down for that sunrise mission you mentioned.',
        timestamp: '2024-05-01T09:30:00Z',
      },
      {
        id: 2,
        sender: 'you',
        content: 'Let’s lock a weekend. I’ll bring the pour-over kit ☕️',
        timestamp: '2024-05-01T09:34:00Z',
      },
    ],
  },
  {
    id: 3,
    matchId: 3,
    matchName: 'Luna',
    matchAvatar: 'https://picsum.photos/seed/luna/200/200',
    lastActive: '12m ago',
    unseenCount: 2,
    messages: [
      {
        id: 1,
        sender: 'match',
        content: 'Ran tokenomics for that memecoin you sent. Chaotic good energy 😂',
        timestamp: '2024-04-30T18:12:00Z',
      },
      {
        id: 2,
        sender: 'you',
        content: 'Need your alpha on my next pitch deck?',
        timestamp: '2024-04-30T18:20:00Z',
      },
      {
        id: 3,
        sender: 'match',
        content: 'Only if dinner is included.',
        timestamp: '2024-04-30T18:22:00Z',
      },
    ],
  },
  {
    id: 5,
    matchId: 5,
    matchName: 'Aria',
    matchAvatar: 'https://picsum.photos/seed/aria/200/200',
    lastActive: '1h ago',
    unseenCount: 0,
    messages: [
      {
        id: 1,
        sender: 'match',
        content: 'Leaving Tokyo for Lisbon next month. Any rooftop bars we should hit?',
        timestamp: '2024-04-29T15:45:00Z',
      },
    ],
  },
];

type UseChatThreadsOptions = {
  initialThreadId?: number;
  initialMatchId?: number;
};

export function useChatThreads(options: UseChatThreadsOptions = {}) {
  const { initialThreadId, initialMatchId } = options;
  const [threads, setThreads] = useState<ChatThread[]>(mockThreads);

  const resolvedInitialThreadId = useMemo(() => {
    if (initialThreadId) {
      const target = threads.find((thread) => thread.id === initialThreadId);
      if (target) return target.id;
    }

    if (initialMatchId) {
      const matchThread = threads.find((thread) => thread.matchId === initialMatchId);
      if (matchThread) return matchThread.id;
    }

    return threads[0]?.id ?? 1;
  }, [initialThreadId, initialMatchId, threads]);

  const [activeThreadId, setActiveThreadId] = useState<number>(resolvedInitialThreadId);

  useEffect(() => {
    setActiveThreadId((prev) => (prev === resolvedInitialThreadId ? prev : resolvedInitialThreadId));
  }, [resolvedInitialThreadId]);

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeThreadId) || null, [threads, activeThreadId]);

  const selectThread = (threadId: number) => {
    if (threadId === activeThreadId) return;
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              unseenCount: 0,
            }
          : thread,
      ),
    );
    setActiveThreadId(threadId);
  };

  const sendMessage = (content: string) => {
    if (!activeThread) return;

    const newMessage: ChatMessage = {
      id: activeThread.messages.length + 1,
      sender: 'you',
      content,
      timestamp: new Date().toISOString(),
    };

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              messages: [...thread.messages, newMessage],
              lastActive: 'just now',
            }
          : thread,
      ),
    );
  };

  return {
    threads,
    activeThread,
    activeThreadId,
    selectThread,
    sendMessage,
  };
}
