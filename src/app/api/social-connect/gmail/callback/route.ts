import { NextResponse } from 'next/server';
import { upsertSocialAccount } from '@/lib/socialAuthStore';
import crypto from 'crypto';

// Check if Gmail OAuth is properly configured
function isGmailConfigured(): boolean {
  return !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.NEXT_PUBLIC_BASE_URL);
}

export async function GET(request: Request) {
  // This will only work if Gmail is properly configured
  if (!isGmailConfigured()) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?error=gmail_not_configured`);
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

  const storedState = cookies['gmail_oauth_state'];
  const wallet = cookies['gmail_oauth_wallet'];

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
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GMAIL_CLIENT_ID!,
        client_secret: process.env.GMAIL_CLIENT_SECRET!,
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/social-connect/gmail/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Gmail token exchange error:', errorData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error('Google user info error:', errorData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=user_info_failed`);
    }

    const userData = await userResponse.json();

    // Store the social account in Supabase
    const accountData = {
      wallet_public_key: wallet,
      provider: 'gmail' as const,
      provider_user_id: userData.id,
      email: userData.email,
      handle: userData.name,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      verified: userData.verified_email,
    };

    const account = await upsertSocialAccount(wallet, accountData);

    if (!account) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=account_storage_failed`);
    }

    // Redirect back to app with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?social_connect=success&provider=gmail`);

  } catch (error) {
    console.error('Gmail OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=oauth_failed`);
  }
}