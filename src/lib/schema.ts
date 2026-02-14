import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  boolean,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

// ── Profiles ──────────────────────────────────────────
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletPublicKey: text('wallet_public_key').notNull().unique(),
  handle: text('handle').notNull().unique(),
  birthday: date('birthday').notNull(),
  gender: text('gender').notNull(),
  interests: jsonb('interests').$type<string[]>().default([]),
  photos: jsonb('photos').$type<string[]>().default([]),
  bio: text('bio').default(''),
  location: text('location').default(''),
  occupation: text('occupation').default(''),
  pronouns: text('pronouns').default(''),
  socialHandles: jsonb('social_handles').$type<Record<string, string>>().default({}),
  favoriteTokens: jsonb('favorite_tokens').$type<string[]>().default([]),
  bestExperience: text('best_experience').default(''),
  jobTitle: text('job_title').default(''),
  company: text('company').default(''),
  industry: text('industry').default(''),
  experience: text('experience').default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Swipes ────────────────────────────────────────────
export const swipes = pgTable('swipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  swiperWallet: text('swiper_wallet').notNull().references(() => profiles.walletPublicKey, { onDelete: 'cascade' }),
  swipedWallet: text('swiped_wallet').notNull().references(() => profiles.walletPublicKey, { onDelete: 'cascade' }),
  direction: text('direction').notNull(), // 'left' | 'right' | 'superlike'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Matches ───────────────────────────────────────────
export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletA: text('wallet_a').notNull().references(() => profiles.walletPublicKey, { onDelete: 'cascade' }),
  walletB: text('wallet_b').notNull().references(() => profiles.walletPublicKey, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Chat threads ──────────────────────────────────────
export const chatThreads = pgTable('chat_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }),
  walletA: text('wallet_a').references(() => profiles.walletPublicKey, { onDelete: 'cascade' }),
  walletB: text('wallet_b').references(() => profiles.walletPublicKey, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Chat messages ─────────────────────────────────────
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  threadId: uuid('thread_id').notNull().references(() => chatThreads.id, { onDelete: 'cascade' }),
  senderWallet: text('sender_wallet').notNull(),
  content: text('content').notNull(),
  status: text('status').default('sent'), // 'sending' | 'sent' | 'read'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── User settings ─────────────────────────────────────
export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletPublicKey: text('wallet_public_key').notNull().unique().references(() => profiles.walletPublicKey, { onDelete: 'cascade' }),
  theme: text('theme').default('system'),
  language: text('language').default('en'),
  monochromePictures: boolean('monochrome_pictures').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Proxy wallets ────────────────────────────────────
export const proxyWallets = pgTable('proxy_wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  walletPublicKey: text('wallet_public_key').notNull().unique().references(() => profiles.walletPublicKey, { onDelete: 'cascade' }),
  proxyPublicKey: text('proxy_public_key').notNull().unique(),
  proxyPrivateKey: text('proxy_private_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
