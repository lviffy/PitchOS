import { NextResponse } from 'next/server';
import { publicTournaments } from './store';
import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'pitchos-default-secret-key-2026';

function verifyToken(token: string, secret: string) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const signature = crypto.createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    if (signature !== signatureB64) return null;
    
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET() {
  const tournaments = Array.from(publicTournaments.values());
  return NextResponse.json({ tournaments });
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const session = verifyToken(token, SECRET_KEY);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: invalid or expired session' }, { status: 401 });
    }

    const { tournament } = await request.json();
    if (!tournament || !tournament.id || !tournament.name) {
      return NextResponse.json({ error: 'Invalid tournament payload' }, { status: 400 });
    }

    // Save/cache tournament to public gateway
    publicTournaments.set(tournament.id, tournament);

    return NextResponse.json({ status: 'success', tournamentId: tournament.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Publish failed' }, { status: 500 });
  }
}
