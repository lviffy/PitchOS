import { NextResponse } from 'next/server';
import { verifyAuthResponse } from '@pitchos/shared-types';
import { challenges } from '../store';
import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'pitchos-default-secret-key-2026';

function signToken(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const { did, signature, nonce } = await request.json();

    if (!did || !signature || !nonce) {
      return NextResponse.json({ error: 'Missing auth response fields' }, { status: 400 });
    }

    const cachedChallenge = challenges.get(nonce);
    if (!cachedChallenge) {
      return NextResponse.json({ error: 'Invalid or expired nonce challenge' }, { status: 400 });
    }

    // Verify signature
    const isValid = await verifyAuthResponse(cachedChallenge, { did, signature, nonce });
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid cryptographic signature' }, { status: 401 });
    }

    // Remove the verified challenge from cache
    challenges.delete(nonce);

    // Issue JWT token
    const token = signToken({
      did,
      exp: Math.floor(Date.now() / 1000) + 900 // 15 minutes session expiry
    }, SECRET_KEY);

    return NextResponse.json({ status: 'success', token, did });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Auth verification failed' }, { status: 500 });
  }
}
