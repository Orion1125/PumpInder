import { NextResponse } from 'next/server';
import { upsertSocialAccount } from '@/lib/socialAuthStore';
import crypto from 'crypto';

// Check if Twitter OAuth is properly configured
function isTwitterConfigured(): boolean {
  return !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET && process.env.NEXT_PUBLIC_BASE_URL);
}

export async function GET(request: Request) {
  // This will only work if Twitter is properly configured
  if (!isTwitterConfigured()) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?error=twitter_not_configured`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get state from cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return [name, value];
    })
  );

  const storedState = cookies['twitter_oauth_state'];
  const wallet = cookies['twitter_oauth_wallet'];

  // Validate state parameter
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=invalid_state`);
  }

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${error}`);
  }

  if (!code || !wallet) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=missing_code_or_wallet`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/social-connect/twitter/callback`,
        code_verifier: 'challenge',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Twitter token exchange error:', errorData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Get user info from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error('Twitter user info error:', errorData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=user_info_failed`);
    }

    const userData = await userResponse.json();
    const twitterUser = userData.data;

    // Store the social account in Supabase
    const accountData = {
      wallet_public_key: wallet,
      provider: 'twitter' as const,
      provider_user_id: twitterUser.id,
      handle: twitterUser.username,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      verified: true,
    };

    const account = await upsertSocialAccount(wallet, accountData);

    if (!account) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=account_storage_failed`);
    }

    // Redirect back to app with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?social_connect=success&provider=twitter`);

  } catch (error) {
    console.error('Twitter OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=oauth_failed`);
  }
}