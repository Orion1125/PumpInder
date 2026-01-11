import { useState } from 'react';
import { UserProfile } from '@/types';

const initialProfiles: UserProfile[] = [
  {
    id: 1,
    name: 'Celeste',
    age: 24,
    bio: 'NFT artist & sunrise chaser. Looking for someone to explore virtual worlds and real mountains with. Probably holding a jpeg worth more than my car.',
    interests: ['DeFi', 'Hiking', 'VR Gaming', 'Generative Art'],
    imageUrl: `https://picsum.photos/seed/celeste/800/1200`,
    likesYou: true,
    location: 'Ethereum, US',
    occupation: 'NFT Artist',
  },
  {
    id: 2,
    name: 'Jax',
    age: 28,
    bio: 'Solidity dev by day, DJ by night. My life is a mix of smart contracts and sick beats. Let\'s find a rhythm together.',
    interests: ['Live Music', 'Smart Contracts', 'ETH Global', 'ラーメン'],
    imageUrl: `https://picsum.photos/seed/jax/800/1200`,
    likesYou: false,
    location: 'Lisbon, PT',
    occupation: 'Solidity Developer',
  },
  {
    id: 3,
    name: 'Luna',
    age: 22,
    bio: 'Tokenomics researcher who believes in a decentralized future. Also really good at making pasta from scratch. Wen date?',
    interests: ['DAO Governance', 'Cooking', 'Film Photography', 'Yield Farming'],
    imageUrl: `https://picsum.photos/seed/luna/800/1200`,
    likesYou: true,
    location: 'The Metaverse',
    occupation: 'Tokenomics Researcher',
  },
  {
    id: 4,
    name: 'Orion',
    age: 31,
    bio: 'Built a few dApps, broke a few hearts. Just kidding... mostly. Seeking a co-founder for life. Must be bullish on love.',
    interests: ['Staking', 'Climbing', 'Sci-Fi Novels', 'Espresso'],
    imageUrl: `https://picsum.photos/seed/orion/800/1200`,
    likesYou: false,
    location: 'San Francisco, US',
    occupation: 'dApp Founder',
  },
  {
    id: 5,
    name: 'Aria',
    age: 26,
    bio: 'Community manager for a top GameFi project. My DMs are open for alpha, but my heart requires a bit more effort.',
    interests: ['Axie Infinity', 'Yoga', 'Travel', 'Meme Coins'],
    imageUrl: `https://picsum.photos/seed/aria/800/1200`,
    likesYou: true,
    location: 'Tokyo, JP',
    occupation: 'Community Manager',
  },
  {
    id: 6,
    name: 'Leo',
    age: 29,
    bio: 'Professional shitposter, amateur chef. If you can handle my memecoin portfolio, you can handle anything. LFG!',
    interests: ['Memes', 'Grilling', 'Podcasts', 'Solana'],
    imageUrl: `https://picsum.photos/seed/leo/800/1200`,
    likesYou: true,
    location: 'The Memepool',
    occupation: 'Professional Shitposter',
  },
];

export function useProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>(initialProfiles);

  const removeProfile = (profileId: number) => {
    setProfiles((prev) => prev.filter((profile) => profile.id !== profileId));
  };

  return { profiles, removeProfile };
}
