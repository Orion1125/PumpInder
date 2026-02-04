'use client';

import { AppHeader } from './AppHeader';

type ActivePage = 'swipe' | 'chat';

interface SwipeHeaderProps {
  activePage: ActivePage;
  balanceDisplay: string;
}

export function SwipeHeader({ activePage, balanceDisplay }: SwipeHeaderProps) {
  return (
    <AppHeader
      activePage={activePage}
      balanceDisplay={balanceDisplay}
      logoType="pumpinder"
      showBalance={true}
      showProfile={true}
      showNav={true}
    />
  );
}
