import { pusherServer } from '@/lib/pusher-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const data = await req.text();
  const [socketId, channelName] = data.split('&').map((str) => str.split('=')[1]);

  // For now, we'll authorize everyone
  const auth = pusherServer.authorizeChannel(socketId, channelName);
  return NextResponse.json(auth);
}
