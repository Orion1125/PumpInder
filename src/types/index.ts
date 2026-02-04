export interface UserProfile {
  id: number;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  imageUrl: string;
  likesYou: boolean;
  location: string;
  occupation: string;
}

export type MessageStatus = 'sending' | 'sent' | 'read';

export interface ChatMessage {
  id: number;
  sender: 'you' | 'match';
  content: string;
  timestamp: string;
  status?: MessageStatus;
}

export interface ChatThread {
  id: number;
  matchId: number;
  matchName: string;
  matchAvatar: string;
  lastActive: string;
  unseenCount: number;
  messages: ChatMessage[];
}
