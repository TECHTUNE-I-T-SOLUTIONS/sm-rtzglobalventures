import { pusherServer } from '@/lib/pusher-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { channel, message } = await req.json();
  await pusherServer.trigger(channel, 'new-message', message);
  return NextResponse.json({ success: true });
}