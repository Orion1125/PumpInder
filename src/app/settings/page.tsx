'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Eye,
  HelpCircle,
  Key,
  Power,
  Shield,
  X,
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { AppHeader } from '@/components/AppHeader';
import LoginMethodsModal from '@/components/LoginMethodsModal';
import AppearanceModal from '@/components/AppearanceModal';
import { useTranslation } from '@/hooks/useTranslation';

const menuItems = [
  {
    id: 'login_methods',
    labelKey: 'settings.loginMethods',
    href: '/settings/login-methods',
    icon: Key,
    isModal: true,
  },
  {
    id: 'account_security',
    labelKey: 'settings.accountSecurity',
    href: '/settings/security',
    icon: Shield,
    isModal: false,
  },
  {
    id: 'appearance',
    labelKey: 'settings.appearance',
    href: '/settings/appearance',
    icon: Eye,
    isModal: true,
  },
  {
    id: 'help_support',
    labelKey: 'settings.helpSupport',
    href: '/settings/support',
    icon: HelpCircle,
    isModal: false,
  },
] as const;

export default function SettingsMainPage() {
  const { clearWallet } = useWallet();
  const router = useRouter();
  const { t } = useTranslation();
  const [showLoginMethodsModal, setShowLoginMethodsModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);

  const handleLogout = () => {
    clearWallet();
    router.push('/');
  };

  const handleLoginMethodsClick = () => {
    setShowLoginMethodsModal(true);
  };

  const handleAppearanceClick = () => {
    setShowAppearanceModal(true);
  };

  return (
    <div className="swipe-page">
      <AppHeader activePage="swipe" balanceDisplay="100.00" />
      
      <div className="flex justify-center">
        <section className="w-full max-w-md bg-white border-4 border-black rounded-xl shadow-[10px_10px_0px_rgba(0,0,0,0.2)] overflow-hidden" aria-labelledby="settings-heading">
          <h1 id="settings-heading" className="display-font text-2xl font-bold tracking-wider uppercase text-center py-6 border-b-4 border-black">{t('settings.title')}</h1>

          <nav className="flex flex-col p-6 gap-4" aria-label="Settings categories">
            {menuItems.map(({ id, labelKey, icon: Icon, href, isModal }) => {
              if (isModal) {
                const handleClick = id === 'login_methods' ? handleLoginMethodsClick : handleAppearanceClick;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={handleClick}
                    className="flex items-center justify-between h-16 px-5 border-2 border-black rounded-md shadow-[3px_3px_0px_#121212] bg-white text-black no-underline font-mono text-sm tracking-wider uppercase transition-all hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#121212] active:translate-y-[2px] active:shadow-[0px_0px_0px_#121212] focus:outline-none w-full cursor-pointer"
                  >
                    <div className="inline-flex items-center gap-3">
                      <span className="w-8 h-8 grid place-items-center" aria-hidden="true">
                        <Icon size={20} strokeWidth={2.5} />
                      </span>
                      <span>{t(labelKey)}</span>
                    </div>
                    <ChevronRight aria-hidden="true" size={22} strokeWidth={3} />
                  </button>
                );
              } else {
                return (
                  <Link
                    key={id}
                    href={href}
                    className="flex items-center justify-between h-16 px-5 border-2 border-black rounded-md shadow-[3px_3px_0px_#121212] bg-white text-black no-underline font-mono text-sm tracking-wider uppercase transition-all hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_#121212] active:translate-y-[2px] active:shadow-[0px_0px_0px_#121212] focus:outline-none"
                    prefetch={false}
                  >
                    <div className="inline-flex items-center gap-3">
                      <span className="w-8 h-8 grid place-items-center" aria-hidden="true">
                        <Icon size={20} strokeWidth={2.5} />
                      </span>
                      <span>{t(labelKey)}</span>
                    </div>
                    <ChevronRight aria-hidden="true" size={22} strokeWidth={3} />
                  </Link>
                );
              }
            })}
          </nav>

          <div className="px-6 pb-6 flex flex-col gap-6">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-between h-16 px-5 border-4 border-red-500 text-red-500 rounded-md shadow-[3px_3px_0px_#FF0000] bg-white font-mono text-sm tracking-wider uppercase transition-all hover:shadow-[5px_5px_0px_#FF0000] active:shadow-[0_0_0_#FF0000] w-full cursor-pointer focus:outline-none"
            >
              <div className="inline-flex items-center gap-3">
                <span className="w-8 h-8 text-red-500 grid place-items-center" aria-hidden="true">
                  <X size={20} strokeWidth={2.5} />
                </span>
                <span>{t('settings.logout')}</span>
              </div>
              <Power aria-hidden="true" size={22} strokeWidth={3} />
            </button>
            <p className="font-mono text-xs uppercase tracking-wider text-[#4A4A4A] text-center">{t('settings.returnMessage')}</p>
          </div>
        </section>
      </div>

      <LoginMethodsModal 
        isOpen={showLoginMethodsModal}
        onClose={() => setShowLoginMethodsModal(false)}
      />
      
      <AppearanceModal 
        isOpen={showAppearanceModal}
        onClose={() => setShowAppearanceModal(false)}
      />
    </div>
  );
}
