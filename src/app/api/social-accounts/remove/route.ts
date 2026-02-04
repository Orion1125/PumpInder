import { NextResponse } from 'next/server';
import { removeSocialAccount } from '@/lib/socialAuthStore';

export async function POST(request: Request) {
  const { wallet, provider } = await request.json();

  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
  }

  if (!provider) {
    return NextResponse.json({ error: 'Missing provider' }, { status: 400 });
  }

  try {
    const success = await removeSocialAccount(wallet, provider);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to remove social account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing social account:', error);
    return NextResponse.json({ error: 'Failed to remove social account' }, { status: 500 });
  }
}