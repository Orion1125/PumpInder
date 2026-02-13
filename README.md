# PumpInder - Social Dating App

This is a Next.js social dating application that allows users to connect using their wallet and social media accounts.

## Features

- Wallet-based authentication
- Social media integration (Twitter, Gmail)
- Real-time matching and chat
- Profile management
- Settings customization

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Setup

1. Copy the `.env.example` file to `.env.local`:
```bash
cp .env.example .env.local
```

2. Configure the following environment variables:

### Supabase Configuration
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Base URL
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Twitter OAuth (Optional)
```env
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

### Gmail OAuth (Optional)
```env
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
```

## Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL scripts in the following order:
   - `supabase-schema-updated.sql` - Main database schema
   - `supabase-functions.sql` - Database functions

## Social Authentication Setup

### Twitter OAuth Setup
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app and enable OAuth 2.0 (Web App)
3. In Supabase Dashboard → Authentication → Providers → X (Twitter), copy the **Callback URL** (usually `https://<project-ref>.supabase.co/auth/v1/callback`)
4. In X Developer Portal → User authentication settings, add that exact Supabase callback URL to **Callback URI / Redirect URL**
5. Copy the OAuth 2.0 Client ID and Client Secret to your environment variables
6. For Vercel production, set `NEXT_PUBLIC_SITE_URL` to your deployed domain and add that domain under Supabase Authentication → URL Configuration

### Gmail OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials
5. Set authorized redirect URI to: `http://localhost:3000/api/social-connect/gmail/callback`
6. Copy the Client ID and Client Secret to your environment variables

## Testing Social Authentication

For development and testing purposes, you can use the mock authentication endpoints:

- Twitter: `/api/social-connect/twitter` with `{ "wallet": "your_wallet", "action": "mock" }`
- Gmail: `/api/social-connect/gmail` with `{ "wallet": "your_wallet", "action": "mock" }`

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   └── social-connect/ # Social authentication APIs
│   └── ...                # Other pages
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── types/                 # TypeScript types
└── utils/                 # Helper functions
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Twitter OAuth 2.0](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.