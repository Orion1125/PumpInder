import { NextRequest, NextResponse } from 'next/server';
import { upsertSocialAccount } from '@/lib/socialAuthStore';

function getBaseUrl(request: NextRequest): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  return request.nextUrl.origin;
}

function isTwitterConfigured(): boolean {
  return Boolean(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET);
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);

  if (!isTwitterConfigured()) {
    return NextResponse.redirect(`${baseUrl}/?error=twitter_not_configured`);
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  const storedState = request.cookies.get('twitter_oauth_state')?.value;
  const wallet = request.cookies.get('twitter_oauth_wallet')?.value;
  const codeVerifier = request.cookies.get('twitter_oauth_code_verifier')?.value;

  if (!state || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/?error=invalid_state`);
  }

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error)}`);
  }

  if (!code || !wallet || !codeVerifier) {
    return NextResponse.redirect(`${baseUrl}/?error=missing_code_or_wallet`);
  }

  try {
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/social-connect/twitter/callback`,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Twitter token exchange error:', errorData);
      return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      console.error('Twitter user info error:', errorData);
      return NextResponse.redirect(`${baseUrl}/?error=user_info_failed`);
    }

    const userData = await userResponse.json();
    const twitterUser = userData.data;

    const account = await upsertSocialAccount(wallet, {
      wallet_public_key: wallet,
      provider: 'twitter' as const,
      provider_user_id: twitterUser.id,
      handle: twitterUser.username,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      verified: true,
    });

    if (!account) {
      return NextResponse.redirect(`${baseUrl}/?error=account_storage_failed`);
    }

    const response = NextResponse.redirect(`${baseUrl}/?social_connect=success&provider=twitter`);
    response.cookies.delete('twitter_oauth_state');
    response.cookies.delete('twitter_oauth_wallet');
    response.cookies.delete('twitter_oauth_code_verifier');
    return response;
  } catch (oauthError) {
    console.error('Twitter OAuth error:', oauthError);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_failed`);
  }
}
