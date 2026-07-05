import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
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

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const session = verifyToken(token, SECRET_KEY);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: invalid or expired session' }, { status: 401 });
    }

    const { subscription } = await request.json();
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
    }

    const did = session.did;

    await query(
      `INSERT INTO push_subscriptions (did, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET
         did = EXCLUDED.did,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth`,
      [did, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );

    return NextResponse.json({ status: 'success', message: 'Subscribed to notifications' });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Subscription failed' }, { status: 500 });
  }
}
