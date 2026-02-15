'use client';

import { AppHeader } from './AppHeader';

type ActivePage = 'swipe' | 'chat';

interface SwipeHeaderProps {
  activePage: ActivePage;
  balance: number;
}

export function SwipeHeader({ activePage, balance }: SwipeHeaderProps) {
  return (
    <AppHeader
      activePage={activePage}
      balance={balance}
      logoType="mypinder"
      showBalance={true}
      showProfile={true}
      showNav={true}
    />
  );
}
