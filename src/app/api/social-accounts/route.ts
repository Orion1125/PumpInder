import { NextResponse } from 'next/server';
import { listSocialAccounts } from '@/lib/socialAuthStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json(
      { error: 'Missing wallet parameter' },
      { status: 400 },
    );
  }

  try {
    const accounts = await listSocialAccounts(wallet);
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    // Return empty array as fallback
    return NextResponse.json({ accounts: [] });
  }
}