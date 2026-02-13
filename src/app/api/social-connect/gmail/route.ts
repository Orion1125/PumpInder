import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const wallet = typeof body?.wallet === 'string' ? body.wallet : '';

  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
  }

  if (!isGmailConfigured()) {
    return NextResponse.json(
      { error: 'Gmail OAuth is not configured. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET.' },
      { status: 503 },
    );
  }

  const baseUrl = getBaseUrl(request);
  const state = generateState();
  const scope = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', process.env.GMAIL_CLIENT_ID!);
  authUrl.searchParams.append('redirect_uri', `${baseUrl}/api/social-connect/gmail/callback`);
  authUrl.searchParams.append('scope', scope);
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('state', state);

  const response = NextResponse.json({ success: true, authUrl: authUrl.toString() });

  response.cookies.set('gmail_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  });

  response.cookies.set('gmail_oauth_wallet', wallet, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  });

  return response;
}
