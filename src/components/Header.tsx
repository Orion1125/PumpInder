'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectWalletButton } from './ConnectWalletButton';

interface HeaderProps {
  balance: number;
}

export function Header({ balance }: HeaderProps) {
  const pathname = usePathname();
  const navLinks = [
    { href: '/swipe', label: 'Swipe' },
    { href: '/chat', label: 'Chat' },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-white/5 bg-pinder-dark/70 backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-8 py-5 lg:px-12">
        <div className="flex items-center gap-6 text-white">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-2xl font-black">
            P
          </span>
          <div>
            <p className="text-2xl font-black tracking-tight">
              Pump<span className="text-pinder-pink">Inder</span>
            </p>
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">on-chain chemistry desk</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                    isActive
                      ? 'border-pinder-pink/70 text-white'
                      : 'border-white/15 text-white/60 hover:border-pinder-pink/50 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/profile/edit"
            className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/70 transition hover:border-pinder-pink/60 hover:text-white md:inline-flex"
          >
            Profile
          </Link>
          <ConnectWalletButton balance={balance} />
        </div>
      </div>
    </header>
  );
}
