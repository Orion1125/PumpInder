'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FormEvent, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { useChatThreads } from '@/hooks/useChatThreads';

const MOCK_BALANCE = 100;

function ChatPageInner() {
  const searchParams = useSearchParams();
  const threadParam = searchParams.get('thread');
  const matchParam = searchParams.get('match');

  const initialThreadId = threadParam ? Number(threadParam) : undefined;
  const initialMatchId = matchParam ? Number(matchParam) : undefined;

  const { threads, activeThread, selectThread, sendMessage } = useChatThreads({
    initialThreadId: Number.isNaN(initialThreadId) ? undefined : initialThreadId,
    initialMatchId: Number.isNaN(initialMatchId) ? undefined : initialMatchId,
  });

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sortedThreads = useMemo(
    () =>
      [...threads].sort((a, b) => {
        if (a.unseenCount && !b.unseenCount) return -1;
        if (!a.unseenCount && b.unseenCount) return 1;
        return 0;
      }),
    [threads],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim() || !activeThread) return;

    setIsSending(true);
    sendMessage(message.trim());
    setMessage('');
    setTimeout(() => setIsSending(false), 120);
  };

  return (
    <div className="min-h-screen bg-pinder-dark text-white">
      <Header balance={MOCK_BALANCE} />

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-12 pt-28 lg:px-8">
        <div className="flex flex-col gap-3 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/swipe"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-pinder-pink/60 hover:text-white"
          >
            ← Back to swipe
          </Link>
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Chats are local for this demo build</p>
        </div>

        <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-10">
          <section className="w-full rounded-3xl border border-white/10 bg-black/40 p-4 shadow-lg shadow-black/30 lg:w-[320px]">
            <p className="px-3 text-xs uppercase tracking-[0.4em] text-white/50">Matches</p>
            <div className="mt-4 space-y-2">
              {sortedThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => selectThread(thread.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition hover:border-pinder-pink/60 hover:bg-white/5 ${
                    thread.id === activeThread?.id ? 'border-pinder-pink/60 bg-white/5' : 'border-white/10 bg-white/0'
                  }`}
                >
                  <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10">
                    <Image
                      src={thread.matchAvatar}
                      alt={thread.matchName}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                    {thread.unseenCount > 0 && (
                      <span className="absolute -top-2 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pinder-pink px-1 text-[10px] font-semibold">
                        {thread.unseenCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/90">{thread.matchName}</p>
                    <p className="text-xs text-white/50">Active {thread.lastActive}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="flex min-h-[60vh] flex-1 flex-col rounded-3xl border border-white/10 bg-black/20 p-6 shadow-2xl shadow-black/30">
            {activeThread ? (
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10">
                    <Image
                      src={activeThread.matchAvatar}
                      alt={activeThread.matchName}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{activeThread.matchName}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">Chat in testing mode</p>
                  </div>
                </div>

                <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-2">
                  {activeThread.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'you' ? 'justify-end' : 'justify-start'} text-sm`}
                    >
                      <div
                        className={`max-w-[80%] rounded-3xl px-4 py-3 shadow-xl shadow-black/30 ${
                          message.sender === 'you'
                            ? 'bg-pinder-pink text-white'
                            : 'border border-white/10 bg-white/5 text-white'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="mt-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/60">
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Send a DM (demo)"
                    className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder-white/40 focus:border-pinder-pink focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || isSending}
                    className="rounded-full bg-pinder-pink px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white transition disabled:opacity-60"
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-lg font-semibold">No active chat selected</p>
                <p className="mt-2 text-sm text-white/60">Pick a match from the left to load messages.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pinder-dark text-white flex items-center justify-center">Loading chats...</div>}>
      <ChatPageInner />
    </Suspense>
  );
}
