import { NextRequest, NextResponse } from 'next/server';
import { upsertSocialAccount } from '@/lib/socialAuthStore';

function getBaseUrl(request: NextRequest): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  return request.nextUrl.origin;
}

function isGmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET);
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);

  if (!isGmailConfigured()) {
    return NextResponse.redirect(`${baseUrl}/?error=gmail_not_configured`);
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');

  const storedState = request.cookies.get('gmail_oauth_state')?.value;
  const wallet = request.cookies.get('gmail_oauth_wallet')?.value;

  if (!state || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/?error=invalid_state`);
  }

  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error)}`);
  }

  if (!code || !wallet) {
    return NextResponse.redirect(`${baseUrl}/?error=missing_code_or_wallet`);
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GMAIL_CLIENT_ID!,
        client_secret: process.env.GMAIL_CLIENT_SECRET!,
        code,
        redirect_uri: `${baseUrl}/api/social-connect/gmail/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Gmail token exchange error:', errorData);
      return NextResponse.redirect(`${baseUrl}/?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      console.error('Google user info error:', errorData);
      return NextResponse.redirect(`${baseUrl}/?error=user_info_failed`);
    }

    const userData = await userResponse.json();

    const account = await upsertSocialAccount(wallet, {
      wallet_public_key: wallet,
      provider: 'gmail' as const,
      provider_user_id: userData.id,
      email: userData.email,
      handle: userData.name,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      verified: userData.verified_email,
    });

    if (!account) {
      return NextResponse.redirect(`${baseUrl}/?error=account_storage_failed`);
    }

    const response = NextResponse.redirect(`${baseUrl}/?social_connect=success&provider=gmail`);
    response.cookies.delete('gmail_oauth_state');
    response.cookies.delete('gmail_oauth_wallet');
    return response;
  } catch (oauthError) {
    console.error('Gmail OAuth error:', oauthError);
    return NextResponse.redirect(`${baseUrl}/?error=oauth_failed`);
  }
}
