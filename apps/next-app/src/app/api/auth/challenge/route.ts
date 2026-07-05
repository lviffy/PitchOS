import { NextResponse } from 'next/server';
import { generateChallenge } from '@pitchos/shared-types';
import { challenges } from '../store';

export async function GET() {
  const challenge = generateChallenge();
  
  // Cache the challenge
  challenges.set(challenge.nonce, challenge);
  
  // Clean up expired challenges (> 10 mins) to prevent memory leak
  const now = Date.now();
  for (const [nonce, data] of challenges.entries()) {
    if (now - data.timestamp > 600000) {
      challenges.delete(nonce);
    }
  }

  return NextResponse.json(challenge);
}
