'use client';

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
import { Search, Send, Coins, Check, Clock, TrendingUp, TrendingDown, Moon, Heart } from 'lucide-react';
import { useChatThreads, ChatThread, ChatMessage } from '@/hooks/useChatThreads';
import { AppHeader } from '@/components/AppHeader';
import { useFeePaymentModal } from '@/components/FeePaymentModal';
import { useWallet } from '@/hooks/useWallet';

const ACTION_BUTTONS = [
  {
    label: 'TIP',
    Icon: Coins,
    className:
      'bg-[#121212] text-white hover:bg-white hover:text-[#121212] border-[3px] border-[#121212] shadow-[4px_4px_0_#121212]',
  },
];

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const gasEstimate = () => `~0.001 SOL`;


const getLastMessageStatus = (thread: ChatThread) => {
  const lastMessage = thread.messages[thread.messages.length - 1];
  if (!lastMessage || lastMessage.sender !== 'you') return null;
  return lastMessage.status;
};

type SidebarTab = 'chats' | 'liked';

interface LikedProfile {
  walletPublicKey: string;
  handle: string;
  photos: string[];
  bio: string;
  occupation: string;
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadParam = searchParams.get('thread');

  const { threads, activeThread, selectThread, createThread, sendMessage, activeThreadId } = useChatThreads({
    initialThreadId: threadParam ?? undefined,
  });

  const { publicKey } = useWallet();
  const { Modal, initiatePayment } = useFeePaymentModal();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [isTipDropdownOpen, setIsTipDropdownOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chats');
  const [likedProfiles, setLikedProfiles] = useState<LikedProfile[]>([]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tipDropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch liked profiles
  useEffect(() => {
    if (!publicKey) return;
    fetch(`/api/profiles/liked?wallet=${publicKey}`)
      .then((res) => res.json())
      .then((data) => setLikedProfiles(data.profiles || []))
      .catch(() => setLikedProfiles([]));
  }, [publicKey]);

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
    () => sortedThreads.filter((thread) => thread.matchName.toLowerCase().includes(searchTerm.toLowerCase())),
    [sortedThreads, searchTerm],
  );

  const pinnedSignal = threads.length > 0 ? threads[0] : null;

  const playClickSound = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }
    const audioContext = audioCtxRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  useEffect(() => {
    if (activeThreadId) {
      const timeout = setTimeout(() => {
        setIsPeerTyping(true);
        setTimeout(() => setIsPeerTyping(false), 3600);
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [activeThreadId]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tipDropdownRef.current && !tipDropdownRef.current.contains(event.target as Node)) {
        setIsTipDropdownOpen(false);
      }
    };

    if (isTipDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTipDropdownOpen]);

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

  const handleTipSelect = async (amount: number) => {
    if (!activeThread) {
      return;
    }

    setSelectedTip(amount);
    setIsTipDropdownOpen(false);
    playClickSound();
    
    // Map tip amounts to fee types
    let feeType: 'TIP_SMALL' | 'TIP_MEDIUM' | 'TIP_LARGE';
    if (amount <= 1000) {
      feeType = 'TIP_SMALL';
    } else if (amount <= 5000) {
      feeType = 'TIP_MEDIUM';
    } else {
      feeType = 'TIP_LARGE';
    }
    
    // Initiate payment for tip
    await initiatePayment(feeType, activeThread.matchWallet);
    // TODO: Send tip notification to chat
    console.log(`Tip of ${amount} initiated`);
  };

  return (
    <div className="min-h-screen text-(--ink-primary)">
      <AppHeader activePage="chat" />

      <main className="main-content mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-2 pb-8 pt-20 sm:gap-6 sm:px-4 sm:pb-12 sm:pt-28 lg:px-8">
        <div className="flex flex-col gap-3 text-xs uppercase tracking-[0.2em] sm:tracking-[0.35em] text-[#555] sm:flex-row sm:items-center sm:justify-between">
          <p>CHAT WITH YOUR MATCHES HERE</p>
        </div>

        <div className="flex flex-col gap-4 rounded-none border-2 sm:border-4 border-[#121212] bg-[#F4F4F0]/90 shadow-[6px_6px_0_#121212] sm:shadow-[12px_12px_0_#121212] overflow-hidden">
          <div className="flex h-[calc(100dvh-10rem)] sm:h-[800px] flex-col lg:flex-row">
            <aside className="flex w-full flex-col border-b-[3px] border-[#121212] bg-[#F4F4F0] p-3 sm:p-6 lg:w-[30%] lg:border-b-0 lg:border-r-[3px] max-h-[40dvh] lg:max-h-none overflow-y-auto">
              <label className="flex items-center gap-2 sm:gap-3 border-[3px] border-[#121212] bg-white px-3 sm:px-4 py-2.5 sm:py-3 font-mono text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-[3px_3px_0_#121212] sm:shadow-[4px_4px_0_#121212]">
                <Search className="h-4 w-4" />
                <input
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="SEARCH"
                  className="w-full bg-transparent font-mono text-sm uppercase placeholder:text-[#9A9A9A] focus:outline-none"
                />
              </label>

              {/* Sidebar Tabs */}
              <div className="mt-3 sm:mt-4 flex border-[3px] border-[#121212]">
                <button
                  type="button"
                  onClick={() => setSidebarTab('chats')}
                  className={`flex-1 py-2.5 sm:py-2 font-mono text-[0.7rem] sm:text-[0.75rem] uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-colors ${
                    sidebarTab === 'chats'
                      ? 'bg-[#121212] text-white'
                      : 'bg-white text-[#121212] hover:bg-[#E5E5E5]'
                  }`}
                >
                  CHATS
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab('liked')}
                  className={`flex-1 py-2.5 sm:py-2 font-mono text-[0.7rem] sm:text-[0.75rem] uppercase tracking-[0.15em] sm:tracking-[0.2em] border-l-[3px] border-[#121212] transition-colors ${
                    sidebarTab === 'liked'
                      ? 'bg-[#121212] text-white'
                      : 'bg-white text-[#121212] hover:bg-[#E5E5E5]'
                  }`}
                >
                  LIKED ({likedProfiles.length})
                </button>
              </div>

              {sidebarTab === 'chats' ? (
                <>
                  <div className="mt-6 space-y-3">
                    <p className="font-mono text-[0.8rem] uppercase tracking-[0.3em] text-[#555]">PINNED CHAT</p>
                    <div className="space-y-3">
                      {pinnedSignal ? (
                        (() => {
                          const thread = pinnedSignal;
                          return (
                            <button
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
                              {(() => {
                                const status = getLastMessageStatus(thread);
                                if (status) {
                                  switch (status) {
                                    case 'sending':
                                      return <Clock className="h-6 w-6" style={{ color: '#FF4D00' }} />;
                                    case 'sent':
                                      return <Check className="h-6 w-6" style={{ color: '#9A9A9A' }} />;
                                    case 'read':
                                      return <Check className="h-6 w-6" style={{ color: '#5D5FEF' }} />;
                                    default:
                                      return null;
                                  }
                                }
                                return null;
                              })()}
                            </button>
                          );
                        })()
                      ) : null}
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
                            {(() => {
                              const status = getLastMessageStatus(thread);
                              if (status) {
                                switch (status) {
                                  case 'sending':
                                    return <Clock className="h-5 w-5 transition group-hover:scale-110" style={{ color: '#FF4D00' }} />;
                                  case 'sent':
                                    return <Check className="h-5 w-5 transition group-hover:scale-110" style={{ color: '#9A9A9A' }} />;
                                  case 'read':
                                    return <Check className="h-5 w-5 transition group-hover:scale-110" style={{ color: '#5D5FEF' }} />;
                                  default:
                                    return null;
                                }
                              }
                              return null;
                            })()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                /* Liked Profiles tab */
                <div className="mt-6 flex flex-1 flex-col overflow-hidden">
                  <p className="font-mono text-[0.8rem] uppercase tracking-[0.3em] text-[#555]">LIKED PROFILES</p>
                  <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-2">
                    {likedProfiles.length === 0 ? (
                      <p className="rounded-none border-[3px] border-dashed border-[#121212] px-3 py-4 text-center font-mono text-xs uppercase text-[#555]">
                        No liked profiles yet.
                      </p>
                    ) : (
                      likedProfiles.map((lp) => (
                        <button
                          key={lp.walletPublicKey}
                          onClick={async () => {
                            const thread = await createThread(lp.walletPublicKey);
                            if (thread) {
                              setSidebarTab('chats');
                            }
                          }}
                          className="group flex w-full items-center gap-3 border-[3px] border-transparent px-3 py-3 text-left transition hover:border-[#121212] hover:bg-[#E5E5E5]"
                        >
                          <div className="relative h-12 w-12 border-[3px] border-[#121212] bg-white overflow-hidden">
                            {lp.photos?.[0] ? (
                              <Image
                                src={lp.photos[0]}
                                alt={lp.handle}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-[#E5E5E5] flex items-center justify-center">
                                <Heart size={16} className="text-[#FF4D00]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold uppercase tracking-[0.08em]">{lp.handle}</p>
                            <p className="font-mono text-xs text-[#555] truncate">{lp.occupation || lp.bio || 'Web3 Enthusiast'}</p>
                          </div>
                          <Heart size={16} className="text-[#FF4D00] opacity-60 group-hover:opacity-100 transition" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </aside>

            <section className="flex w-full flex-1 flex-col bg-transparent text-[#121212]">
              <div className="flex flex-col gap-4 border-b-[3px] border-[#121212] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {activeThread && (
                    <>
                      <div className="flex items-center gap-3 border-[3px] border-[#121212] bg-white px-3 py-2 shadow-[4px_4px_0_#121212]">
                        <div className="h-10 w-10 border-2 border-[#121212] bg-white">
                          <Image
                            src={activeThread.matchAvatar}
                            alt={activeThread.matchName}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => router.push(`/profile/${activeThread.matchId}`)}
                          className="font-['Clash Display'] text-sm uppercase tracking-[0.2em] hover:text-[#5D5FEF] transition-colors"
                        >
                          {activeThread.matchName}
                        </button>
                      </div>
                      <div className="font-mono text-xs uppercase text-[#555]">Linked · {activeThread.matchName}</div>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedTip && (
                    <span className="flex items-center gap-2 px-3 py-2 text-[0.75rem] font-mono uppercase tracking-[0.15em] border-[3px] border-[#5D5FEF] bg-[#5D5FEF]/10 text-[#5D5FEF]">
                      <Coins className="h-4 w-4" />
                      Last tip: {selectedTip.toLocaleString()} $PINDER
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex-1 overflow-hidden">
                <div className="absolute inset-0 flex flex-col gap-4 overflow-y-auto px-6 py-8">

                  {activeThread ? (
                    <>
                      {activeThread.messages.map((msg: ChatMessage) => {
                        const isYou = msg.sender === 'you';
                        const getStatusIcon = () => {
                          if (!isYou || !msg.status) return null;
                          switch (msg.status) {
                            case 'sending':
                              return <Clock className="h-3 w-3 text-[#FF4D00]" />;
                            case 'sent':
                              return <Check className="h-3 w-3 text-[#9A9A9A]" />;
                            case 'read':
                              return <Check className="h-3 w-3 text-[#5D5FEF]" />;
                            default:
                              return null;
                          }
                        };
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
                              <div className="flex items-center justify-between gap-2">
                                <div
                                  className={`message-hover-meta pointer-events-none absolute -bottom-6 ${
                                    isYou ? 'right-0 text-right' : 'left-0'
                                  } w-max rounded-none bg-[#F4F4F0] px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-[#121212] opacity-0 transition group-hover:opacity-100`}
                                >
                                  {formatTimestamp(msg.timestamp)} · {gasEstimate()}
                                </div>
                                {isYou && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {getStatusIcon()}
                                  </div>
                                )}
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

              <form onSubmit={handleSubmit} className="mt-auto border-t-[3px] border-[#121212] bg-[#E5E5E5] px-3 py-3 sm:px-6 sm:py-4">
                <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center">
                  <div className="flex w-full items-center gap-2 sm:gap-3 border-[3px] border-[#121212] bg-[#E5E5E5] px-3 sm:px-4 py-2.5 sm:py-3 font-mono text-sm sm:text-base uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-[3px_3px_0_#121212] sm:shadow-[4px_4px_0_#121212]">
                    <span className="text-lg sm:text-xl">&gt;</span>
                    <input
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="TYPE_ALPHA_HERE_"
                      className="flex-1 bg-transparent font-mono text-sm placeholder:text-[#777] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                  {/* Tip $PINDER button beside send */}
                  <div className="tip-dropdown-container relative" ref={tipDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsTipDropdownOpen(!isTipDropdownOpen)}
                      disabled={!activeThread}
                      className="flex items-center gap-1.5 sm:gap-2 border-[3px] border-[#121212] bg-[#5D5FEF] px-3 sm:px-4 py-2.5 sm:py-3 font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-white shadow-[3px_3px_0_#121212] sm:shadow-[4px_4px_0_#121212] transition hover:bg-[#4A4CD1] disabled:opacity-40 whitespace-nowrap min-h-[44px]"
                    >
                      <Coins className="h-4 w-4" />
                      TIP
                    </button>
                    <div className={`tip-dropdown ${isTipDropdownOpen ? 'open' : ''}`} role="menu" aria-label="Tip amount options" style={{ bottom: '100%', top: 'auto', marginBottom: '4px' }}>
                      <button className="tip-dropdown-item" role="menuitem" onClick={() => handleTipSelect(1000)}>
                        <TrendingDown className="h-4 w-4" /> 1,000 $PINDER
                      </button>
                      <button className="tip-dropdown-item" role="menuitem" onClick={() => handleTipSelect(5000)}>
                        <TrendingUp className="h-4 w-4" /> 5,000 $PINDER
                      </button>
                      <button className="tip-dropdown-item" role="menuitem" onClick={() => handleTipSelect(10000)}>
                        <Moon className="h-4 w-4" /> 10,000 $PINDER
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!message.trim() || isSending}
                    className="flex items-center gap-1.5 sm:gap-2 border-[3px] border-[#121212] border-l-[6px] bg-[#CFCFCF] px-4 sm:px-6 py-2.5 sm:py-3 font-bold uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[#121212] shadow-[3px_3px_0_#121212] sm:shadow-[4px_4px_0_#121212] transition hover:bg-[#121212] hover:text-white disabled:opacity-40 min-h-[44px] whitespace-nowrap"
                  >
                    SEND
                    <Send className="h-4 w-4" />
                  </button>
                  </div>
                </div>
              </form>
            </section>
          </div>
          
          {/* Fee Payment Modal */}
          <Modal />
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-mono text-(--ink-primary)">
          Loading chats...
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}
