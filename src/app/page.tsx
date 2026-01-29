'use client';

import { useCallback, useTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Pointer } from 'lucide-react';

// Hook to handle client-side mounting to prevent hydration mismatches
function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    const timeoutId = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  return isMounted;
}

export default function Home() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isMounted = useIsMounted();

  const startExperience = useCallback(() => {
    startTransition(() => {
      // For now, always go to onboarding since we removed profile edit and swipe
      router.push('/onboarding');
    });
  }, [router]);

  if (!isMounted) {
    // Return a minimal loading state that matches server render
    return (
      <div className="relative min-h-screen bg-canvas" suppressHydrationWarning>
        <div className="fixed inset-0 border-4 border-black pointer-events-none z-50" suppressHydrationWarning />
        <div className="main-content min-h-screen flex flex-col" suppressHydrationWarning>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-8">
              <h1 className="display-font h1 text-black">YOUR WALLET IS YOUR RIZZ</h1>
              <p className="body ui-font text-ink-secondary max-w-lg mx-auto">
                Stop DMing into the void. Prove your signal on-chain. Every swipe burns $PINDER.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-canvas" suppressHydrationWarning>
      {/* Thick Black Border around viewport */}
      <div className="fixed inset-0 border-4 border-black pointer-events-none z-50" suppressHydrationWarning />
      
      {/* Main Content */}
      <div className="main-content min-h-screen flex flex-col" suppressHydrationWarning>
        {/* Header Navigation */}
        <header className="absolute top-0 left-0 right-0 z-40 p-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="bg-white border-2 border-black px-4 py-2">
              <span className="display-font text-black font-bold text-lg">PUMPINDER™</span>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex gap-8">
              {['TOKENOMICS', 'BASED INTERACTIONS', 'LEARN MORE'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="ui-font text-black hover:underline transition-all"
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-8 pt-24 pb-32">
          <div className="w-full max-w-4xl flex flex-col items-center text-center space-y-8">
            <div className="space-y-6">
              <h1 className="display-font h1 text-black">
                YOUR WALLET IS YOUR{' '}
                <span className="scribble-underline">RIZZ</span>
              </h1>
              
              <p className="body ui-font text-ink-secondary max-w-lg mx-auto">
                Stop DMing into the void. Prove your signal on-chain. Every swipe burns $PINDER.
              </p>
            </div>
            
            <div className="flex gap-4 items-center">
              <button
                onClick={startExperience}
                disabled={isPending}
                className="btn-primary flex items-center gap-3 cursor-pointer disabled:opacity-70"
              >
                <Zap size={20} />
                {isPending ? 'MINTING...' : 'MINT YOUR PROFILE'}
              </button>
              
              <button
                onClick={() => router.push('/swipe')}
                className="flex items-center gap-3 cursor-pointer disabled:opacity-70 px-6 py-4 text-black font-bold text-base border-2 border-black shadow-[4px_4px_0px_#000000] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] uppercase"
                style={{ backgroundColor: '#FFFF00' }}
              >
                <Pointer size={20} />
                CONTINUE SWIPING
              </button>
            </div>
          </div>
        </main>

        {/* Footer Ticker */}
        <footer className="fixed bottom-0 left-0 right-0 ticker z-40">
          <div className="overflow-hidden">
            <div className="ticker-content whitespace-nowrap">
              <span className="inline-block">
                <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE //
              </span>
              <span className="inline-block">
                <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE // <strong>$PINDER</strong> IS LIVE //
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
