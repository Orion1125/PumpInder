export type ReactionType = 'like' | 'superlike' | 'fire' | 'diamond' | 'rocket';

export interface Reaction {
  id: string;
  type: ReactionType;
  fromUserId: string;
  toUserId: string;
  timestamp: Date;
  cost: number;
}

export interface ReactionConfig {
  type: ReactionType;
  name: string;
  emoji: string;
  cost: number;
  color: string;
  description: string;
  perks: string[];
}

export const REACTION_CONFIGS: Record<ReactionType, ReactionConfig> = {
  like: {
    type: 'like',
    name: 'Like',
    emoji: '❤️',
    cost: 1,
    color: 'text-pink-500',
    description: 'Show basic interest',
    perks: [
      'Profile added to their likes',
      'Potential match if mutual'
    ]
  },
  superlike: {
    type: 'superlike',
    name: 'Super Like',
    emoji: '⭐',
    cost: 5,
    color: 'text-yellow-500',
    description: 'Stand out from the crowd',
    perks: [
      'Profile highlighted in blue',
      'Priority in their queue',
      'Higher match probability',
      'Notification boost'
    ]
  },
  fire: {
    type: 'fire',
    name: 'Fire',
    emoji: '🔥',
    cost: 10,
    color: 'text-orange-500',
    description: 'Burn through the competition',
    perks: [
      'Profile featured for 24h',
      'Top of their queue',
      'Guaranteed profile view',
      'Special fire badge',
      '2x match probability'
    ]
  },
  diamond: {
    type: 'diamond',
    name: 'Diamond',
    emoji: '💎',
    cost: 25,
    color: 'text-blue-500',
    description: 'Premium attention getter',
    perks: [
      'Profile featured for 72h',
      'Exclusive diamond badge',
      'Top of queue for 3 days',
      '5x match probability',
      'Direct message access',
      'Profile analytics'
    ]
  },
  rocket: {
    type: 'rocket',
    name: 'Rocket',
    emoji: '🚀',
    cost: 50,
    color: 'text-purple-500',
    description: 'Go viral instantly',
    perks: [
      'Profile featured for 7 days',
      'Legendary rocket badge',
      'Permanent queue priority',
      '10x match probability',
      'Unlimited direct messages',
      'Advanced analytics',
      'Profile verification boost',
      'Featured in discover section'
    ]
  }
};

export function getReactionConfig(type: ReactionType): ReactionConfig {
  return REACTION_CONFIGS[type];
}

export function getReactionsByTier(): ReactionConfig[] {
  return [
    REACTION_CONFIGS.like,
    REACTION_CONFIGS.superlike,
    REACTION_CONFIGS.fire,
    REACTION_CONFIGS.diamond,
    REACTION_CONFIGS.rocket
  ];
}

export function canAffordReaction(balance: number, type: ReactionType): boolean {
  return balance >= REACTION_CONFIGS[type].cost;
}
