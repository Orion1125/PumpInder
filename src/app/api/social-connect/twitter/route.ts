import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

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

function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generatePkceVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generatePkceChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const wallet = typeof body?.wallet === 'string' ? body.wallet : '';

  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
  }

  if (!isTwitterConfigured()) {
    return NextResponse.json(
      { error: 'Twitter OAuth is not configured. Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET.' },
      { status: 503 },
    );
  }

  const baseUrl = getBaseUrl(request);
  const state = generateState();
  const codeVerifier = generatePkceVerifier();
  const codeChallenge = generatePkceChallenge(codeVerifier);
  const scope = 'users.read tweet.read offline.access';

  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', process.env.TWITTER_CLIENT_ID!);
  authUrl.searchParams.append('redirect_uri', `${baseUrl}/api/social-connect/twitter/callback`);
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');

  const response = NextResponse.json({ success: true, authUrl: authUrl.toString() });

  response.cookies.set('twitter_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  });

  response.cookies.set('twitter_oauth_wallet', wallet, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  });

  response.cookies.set('twitter_oauth_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  });

  return response;
}
