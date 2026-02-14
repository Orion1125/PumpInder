export interface UserProfile {
  id: string;
  walletPublicKey: string;
  handle: string;
  birthday: string;
  gender: string;
  interests: string[];
  photos: string[];
  bio: string;
  location: string;
  occupation: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageStatus = 'sending' | 'sent' | 'read';

export interface ChatMessage {
  id: string;
  sender: 'you' | 'match';
  content: string;
  timestamp: string;
  status?: MessageStatus;
}

export interface ChatThread {
  id: string;
  matchId: string;
  matchName: string;
  matchAvatar: string;
  matchWallet: string;
  lastActive: string;
  unseenCount: number;
  messages: ChatMessage[];
}
