import { useMemo, useState, useEffect } from 'react';
import { ChatMessage, ChatThread, MessageStatus } from '@/types';
import { supabase } from '@/lib/supabase';
import { useWallet } from './useWallet';

type UseChatThreadsOptions = {
  initialThreadId?: number;
  initialMatchId?: number;
};

export function useChatThreads(options: UseChatThreadsOptions = {}) {
  const { initialThreadId, initialMatchId } = options;
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { wallet } = useWallet();

  useEffect(() => {
    const loadThreads = async () => {
      if (!wallet?.publicKey) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: threadsData, error: threadsError } = await supabase
          .from('chat_threads')
          .select('*')
          .eq('user_wallet', wallet.publicKey)
          .order('last_active', { ascending: false });

        if (threadsError) {
          console.error('Error loading chat threads:', threadsError);
          return;
        }

        if (!threadsData || threadsData.length === 0) {
          setThreads([]);
          setIsLoading(false);
          return;
        }

        const threadsWithMessages: ChatThread[] = await Promise.all(
          threadsData.map(async (thread) => {
            const { data: messagesData, error: messagesError } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('thread_id', thread.id)
              .order('created_at', { ascending: true });

            if (messagesError) {
              console.error('Error loading messages:', messagesError);
              return {
                id: parseInt(thread.id.split('-')[0] || '0'),
                matchId: parseInt(thread.match_wallet.split('-')[0] || '0'),
                matchName: thread.match_name,
                matchAvatar: thread.match_avatar,
                lastActive: thread.last_active,
                unseenCount: 0,
                messages: [],
              };
            }

            const messages: ChatMessage[] = (messagesData || []).map((msg) => ({
              id: parseInt(msg.id.split('-')[0] || '0'),
              sender: msg.sender_wallet === wallet.publicKey ? 'you' : 'match',
              content: msg.content,
              timestamp: msg.created_at,
              status: msg.status as MessageStatus,
            }));

            return {
              id: parseInt(thread.id.split('-')[0] || '0'),
              matchId: parseInt(thread.match_wallet.split('-')[0] || '0'),
              matchName: thread.match_name,
              matchAvatar: thread.match_avatar,
              lastActive: thread.last_active,
              unseenCount: 0,
              messages,
            };
          })
        );

        setThreads(threadsWithMessages);
      } catch (error) {
        console.error('Error loading chat threads:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThreads();
  }, [wallet?.publicKey]);

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

  const sendMessage = async (content: string) => {
    if (!activeThread || !wallet?.publicKey) return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: 'you',
      content,
      timestamp: new Date().toISOString(),
      status: 'sending',
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

    try {
      const threadData = threads.find(t => t.id === activeThread.id);
      if (!threadData) return;

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: activeThread.id.toString(),
          sender_wallet: wallet.publicKey,
          content,
          status: 'sent',
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === activeThread.id
            ? {
                ...thread,
                messages: thread.messages.map((msg) =>
                  msg.id === newMessage.id ? { ...msg, status: 'sent' as MessageStatus } : msg
                ),
              }
            : thread,
        ),
      );

      setTimeout(() => {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === activeThread.id
              ? {
                  ...thread,
                  messages: thread.messages.map((msg) =>
                    msg.id === newMessage.id ? { ...msg, status: 'read' as MessageStatus } : msg
                  ),
                }
              : thread,
          ),
        );
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === activeThread.id
            ? {
                ...thread,
                messages: thread.messages.filter((msg) => msg.id !== newMessage.id),
              }
            : thread,
        ),
      );
    }
  };

  return {
    threads,
    activeThread,
    activeThreadId,
    selectThread,
    sendMessage,
    isLoading,
  };
}
