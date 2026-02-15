'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Edit, Settings, User } from 'lucide-react';

import { useUserProfile } from '@/hooks/useUserProfile';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { ProxyWalletButton } from '@/components/ProxyWalletButton';

type ActivePage = 'swipe' | 'chat' | null;
type LogoType = 'mypinder' | 'back';

interface AppHeaderProps {
  activePage?: ActivePage;
  logoType?: LogoType;
  showBalance?: boolean;
  showProfile?: boolean;
  showNav?: boolean;
  onLogoClick?: () => void;
  balance?: number; // Optional, will be overridden by real balance from wallet
  onContinueSwiping?: () => void; // Callback for authentication completion
}

export function AppHeader({
  activePage = null,
  logoType = 'mypinder',
  showBalance = true,
  showProfile = true,
  showNav = true,
  onLogoClick,
  balance = 0, // Default balance
  onContinueSwiping,
}: AppHeaderProps) {
  const router = useRouter();
  const { getProfilePicture } = useUserProfile();

  const handleProfileAction = (path: string) => {
    router.push(path);
  };

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else if (logoType === 'back') {
      router.back();
    } else {
      router.push('/');
    }
  };

  const renderNavButton = (page: ActivePage, label: string, href: string) => {
    const isActive = activePage === page;
    return (
      <button 
        className={isActive ? 'is-active' : undefined} 
        onClick={!isActive ? () => router.push(href) : undefined}
      >
        {label}
      </button>
    );
  };

  const renderLogo = () => {
    if (logoType === 'back') {
      return '← BACK';
    }
    return 'MYPINDER™';
  };

  return (
    <header className="swipe-header">
      <button className="swipe-logo" aria-label={logoType === 'back' ? 'Go back' : 'Mypinder home'} onClick={handleLogoClick}>
        {renderLogo()}
      </button>
      
      {showNav && (
        <nav className="swipe-nav-toggle" aria-label="Primary navigation">
          {renderNavButton('swipe', 'Swipe', '/swipe')}
          {renderNavButton('chat', 'Chat', '/chat')}
        </nav>
      )}
      
      {(showBalance || showProfile) && (
        <div className="swipe-header-right">
          {showBalance && (
            <div className="flex items-center gap-2">
              <ConnectWalletButton balance={balance} onContinueSwiping={onContinueSwiping} />
              <ProxyWalletButton />
            </div>
          )}
          
          {showProfile && (
            <div className="profile-dropdown-container">
              <button className="profile-button" aria-label="Profile">
                {getProfilePicture() ? (
                  <Image
                    src={getProfilePicture()!}
                    alt="Profile"
                    width={36}
                    height={36}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User size={20} strokeWidth={2} />
                )}
              </button>
              <div className="profile-dropdown" role="menu" aria-label="Profile actions">
                <button 
                  className="profile-dropdown-item" 
                  role="menuitem" 
                  onClick={() => handleProfileAction('/profile/edit')}
                >
                  <Edit size={16} strokeWidth={2} />
                  Edit Profile
                </button>
                <button 
                  className="profile-dropdown-item" 
                  role="menuitem" 
                  onClick={() => handleProfileAction('/settings')}
                >
                  <Settings size={16} strokeWidth={2} />
                  Settings
                </button>

              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
