'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ChangeEvent,
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, CandlestickChart, ScanLine, Radio, Send, Coins, User, Edit, Settings } from 'lucide-react';
import { useChatThreads } from '@/hooks/useChatThreads';
import type { ChatThread } from '@/types';

const MOCK_BALANCE = 100;

const ACTION_BUTTONS = [
  {
    label: 'TIP',
    Icon: Coins,
    className:
      'bg-[#121212] text-white hover:bg-white hover:text-[#121212] border-[3px] border-[#121212] shadow-[4px_4px_0_#121212]',
  },
  {
    label: 'SCAN',
    Icon: ScanLine,
    className:
      'bg-white text-[#121212] hover:bg-[#121212] hover:text-white border-[3px] border-[#121212] shadow-[4px_4px_0_#121212]',
  },
  {
    label: 'NUKE',
    Icon: Radio,
    className:
      'bg-white text-[#121212] hover:bg-[#121212] hover:text-white border-[3px] border-[#121212] shadow-[4px_4px_0_#121212]',
  },
];

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const gasEstimate = (id: number) => `~${(0.001 + id * 0.00042).toFixed(3)} SOL`;

const isThreadOnline = (thread: ChatThread) =>
  thread.lastActive.toLowerCase().includes('m') || thread.lastActive.toLowerCase().includes('now');

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadParam = searchParams.get('thread');
  const matchParam = searchParams.get('match');

  const initialThreadId = threadParam ? Number(threadParam) : undefined;
  const initialMatchId = matchParam ? Number(matchParam) : undefined;

  const { threads, activeThread, selectThread, sendMessage, activeThreadId } = useChatThreads({
    initialThreadId: Number.isNaN(initialThreadId) ? undefined : initialThreadId,
    initialMatchId: Number.isNaN(initialMatchId) ? undefined : initialMatchId,
  });

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const sortedThreads = useMemo(
    () =>
      [...threads].sort((a, b) => {
        if (a.unseenCount && !b.unseenCount) return -1;
        if (!a.unseenCount && b.unseenCount) return 1;
        return 0;
      }),
    [threads],
  );

  const filteredThreads = useMemo(
    () =>
      sortedThreads.filter((thread) =>
        thread.matchName.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [sortedThreads, searchTerm],
  );

  const pinnedSignals = sortedThreads.slice(0, 2);

  const playClickSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = audioCtxRef.current ?? new AudioCtx();
    audioCtxRef.current = ctx;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 320;
    gainNode.gain.value = 0.08;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);
  }, []);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!activeThreadId) return;
    const timeout = setTimeout(() => {
      setIsPeerTyping(true);
      setTimeout(() => setIsPeerTyping(false), 3600);
    }, 0);
    return () => clearTimeout(timeout);
  }, [activeThreadId]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages.length]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim() || !activeThread) return;

    setIsSending(true);
    sendMessage(message.trim());
    playClickSound();
    setMessage('');
    setTimeout(() => setIsSending(false), 120);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="min-h-screen bg-(--bg-canvas) text-[#121212]">
      <header className="swipe-header">
        <button className="swipe-logo" aria-label="PumpInder home">
          PUMPINDER™
        </button>
        <nav className="swipe-nav-toggle" aria-label="Primary navigation">
          <button onClick={() => router.push('/swipe')}>Swipe</button>
          <button className="is-active">Chat</button>
        </nav>
        <div className="swipe-header-right">
          <div className="swipe-balance" aria-label="Wallet summary">
            <span className="ui-font text-value">{MOCK_BALANCE.toFixed(2)}</span>
            <span className="ui-font text-label">$PINDER</span>
          </div>
          <div className="profile-dropdown-container">
            <button className="profile-button" aria-label="Profile">
              <User size={20} strokeWidth={2} />
            </button>
            <div className="profile-dropdown" role="menu" aria-label="Profile actions">
              <button
                className="profile-dropdown-item"
                role="menuitem"
                onClick={() => router.push('/profile/edit')}
              >
                <Edit size={16} strokeWidth={2} />
                Edit Profile
              </button>
              <button
                className="profile-dropdown-item"
                role="menuitem"
                onClick={() => router.push('/settings')}
              >
                <Settings size={16} strokeWidth={2} />
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 pb-12 pt-28 lg:px-8">
        <div className="flex flex-col gap-3 text-xs uppercase tracking-[0.35em] text-[#555] sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/swipe"
            className="inline-flex items-center gap-2 border-[3px] border-[#121212] bg-white px-4 py-2 font-bold text-[#121212] shadow-[4px_4px_0_#121212] transition hover:-translate-y-0.5"
          >
            ← Back to swipe
          </Link>
          <p>Chats are local for this demo build</p>
        </div>

        <div className="flex flex-col gap-4 rounded-none border-4 border-[#121212] bg-[#F4F4F0]/90 shadow-[12px_12px_0_#121212]">
          <div className="flex h-[800px] flex-col lg:flex-row">
            <aside className="flex w-full flex-col border-b-[3px] border-[#121212] bg-[#F4F4F0] p-6 lg:w-[30%] lg:border-b-0 lg:border-r-[3px]">
              <label className="flex items-center gap-3 border-[3px] border-[#121212] bg-white px-4 py-3 font-mono text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0_#121212]">
                <Search className="h-4 w-4" />
                <input
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="FIND_WALLET..."
                  className="w-full bg-transparent font-mono text-sm uppercase placeholder:text-[#9A9A9A] focus:outline-none"
                />
              </label>

              <div className="mt-6 space-y-3">
                <p className="font-mono text-[0.8rem] uppercase tracking-[0.3em] text-[#555]">ACTIVE SIGNALS [★]</p>
                <div className="space-y-3">
                  {pinnedSignals.map((thread) => {
                    const online = isThreadOnline(thread);
                    return (
                      <button
                        key={`pin-${thread.id}`}
                        onClick={() => selectThread(thread.id)}
                        className={`flex w-full items-center gap-4 border-[3px] border-[#FFD700] bg-white px-3 py-3 text-left shadow-[4px_4px_0_#121212] transition hover:border-[#121212] ${
                          thread.id === activeThread?.id ? 'bg-[#FFF8D2]' : ''
                        }`}
                      >
                        <div className="h-14 w-14 border-[3px] border-[#121212] bg-[#E5E5E5]">
                          <Image
                            src={thread.matchAvatar}
                            alt={thread.matchName}
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-['Clash Display'] text-base uppercase tracking-[0.08em]">{thread.matchName}</p>
                          <p className="font-mono text-xs text-[#555]">Last ping {thread.lastActive}</p>
                        </div>
                        <CandlestickChart
                          className="h-6 w-6"
                          style={{ color: online ? '#00D668' : '#FF4D00' }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex flex-1 flex-col overflow-hidden">
                <p className="font-mono text-[0.8rem] uppercase tracking-[0.3em] text-[#555]">ALL CHATS</p>
                <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-2">
                  {filteredThreads.length === 0 && (
                    <p className="rounded-none border-[3px] border-dashed border-[#121212] px-3 py-4 text-center font-mono text-xs uppercase text-[#555]">
                      No wallets match that query.
                    </p>
                  )}
                  {filteredThreads.map((thread) => {
                    const online = isThreadOnline(thread);
                    return (
                      <button
                        key={thread.id}
                        onClick={() => selectThread(thread.id)}
                        className={`group flex w-full items-center gap-3 border-[3px] border-transparent px-3 py-3 text-left transition hover:border-[#121212] hover:bg-[#E5E5E5] ${
                          thread.id === activeThread?.id ? 'border-[#121212] bg-[#E5E5E5]' : ''
                        }`}
                      >
                        <div className="relative h-12 w-12 border-[3px] border-[#121212] bg-white">
                          <Image
                            src={thread.matchAvatar}
                            alt={thread.matchName}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                          {thread.unseenCount > 0 && (
                            <span className="absolute -top-2 -right-2 rounded-none border-[3px] border-[#121212] bg-[#5D5FEF] px-2 py-0.5 text-[0.6rem] font-bold text-white">
                              {thread.unseenCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold uppercase tracking-[0.08em]">{thread.matchName}</p>
                          <p className="font-mono text-xs text-[#555]">{thread.lastActive}</p>
                        </div>
                        <CandlestickChart
                          className="h-5 w-5 transition group-hover:scale-110"
                          style={{ color: online ? '#00D668' : '#FF4D00' }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <section className="flex w-full flex-1 flex-col bg-transparent text-[#121212]">
              <div className="flex flex-col gap-4 border-b-[3px] border-[#121212] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="border-[3px] border-[#121212] bg-white px-3 py-1 font-['Clash Display'] text-sm uppercase tracking-[0.2em] shadow-[4px_4px_0_#121212]">
                    @SANTOSH_LIMBU
                  </span>
                  {activeThread && (
                    <div className="font-mono text-xs uppercase text-[#555]">Linked · {activeThread.matchName}</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {ACTION_BUTTONS.map(({ label, Icon, className }) => (
                    <button key={label} type="button" className={`flex items-center gap-2 px-4 py-2 text-[0.8rem] font-bold uppercase tracking-[0.2em] transition ${className}`}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex-1 overflow-hidden">
                <div className="absolute inset-0 flex flex-col gap-4 overflow-y-auto px-6 py-8">

                  {activeThread ? (
                    <>
                      {activeThread.messages.map((msg) => {
                        const isYou = msg.sender === 'you';
                        return (
                          <div
                            key={`${activeThread.id}-${msg.id}`}
                            className={`flex animate-slide-up ${isYou ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`group relative max-w-[80%] border-[3px] px-5 py-4 font-mono text-base leading-tight shadow-[4px_4px_0_#000000] ${
                                isYou
                                  ? 'bg-[#5D5FEF] text-white border-[#121212] shadow-[-4px_4px_0_#000000]'
                                  : 'bg-white text-[#121212] border-[#121212]'
                              }`}
                            >
                              <p>{msg.content}</p>
                              <div
                                className={`message-hover-meta pointer-events-none absolute -bottom-6 ${
                                  isYou ? 'right-0 text-right' : 'left-0'
                                } w-max rounded-none bg-[#F4F4F0] px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-[#121212] opacity-0 transition group-hover:opacity-100`}
                              >
                                {formatTimestamp(msg.timestamp)} · {gasEstimate(msg.id)}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {isPeerTyping && (
                        <div className="flex justify-start">
                          <div className="border-[3px] border-[#121212] bg-white px-4 py-2 font-mono text-sm uppercase tracking-[0.4em] shadow-[4px_4px_0_#000000]">
                            TYPING<span className="typing-indicator__cursor ml-2">_</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-12 flex flex-1 flex-col items-center justify-start border-[3px] border-dashed border-[#121212] bg-white/60 px-8 py-12 text-center shadow-[6px_6px_0_#121212]">
                      <p className="font-['Clash Display'] text-2xl uppercase tracking-[0.3em]">No active channel</p>
                      <p className="mt-3 font-mono text-sm uppercase text-[#555]">Select a signal on the left to deploy alpha.</p>
                    </div>
                  )}
                  <div ref={messageEndRef} />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-auto border-t-[3px] border-[#121212] bg-[#E5E5E5] px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex w-full items-center gap-3 border-[3px] border-[#121212] bg-[#E5E5E5] px-4 py-3 font-mono text-base uppercase tracking-[0.2em] shadow-[4px_4px_0_#121212]">
                    <span className="text-xl">&gt;</span>
                    <input
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="TYPE_ALPHA_HERE_"
                      className="flex-1 bg-transparent font-mono text-sm placeholder:text-[#777] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!message.trim() || isSending}
                    className="flex items-center gap-2 border-[3px] border-[#121212] border-l-[6px] bg-[#CFCFCF] px-6 py-3 font-bold uppercase tracking-[0.3em] text-[#121212] shadow-[4px_4px_0_#121212] transition hover:bg-[#121212] hover:text-white disabled:opacity-40"
                  >
                    SEND
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-(--bg-canvas) font-mono text-[#121212]">
          Loading chats...
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
