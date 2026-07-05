import { NextResponse } from 'next/server';
import { challenges } from '../../auth/store';
import { publicTournaments } from '../../tournaments/store';
import { pushSubscriptions } from '../../notifications/store';

// Set of allowed admin source IPs
const ALLOWED_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']);

export async function GET(request: Request) {
  try {
    // 1. IP address check
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip') || (forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1');

    if (!ALLOWED_IPS.has(realIp) && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Forbidden: Admin access restricted' }, { status: 403 });
    }

    // 2. Fetch cache states
    return NextResponse.json({
      status: 'healthy',
      timestamp: Date.now(),
      metrics: {
        activeChallenges: challenges.size,
        cachedTournaments: publicTournaments.size,
        pushSubscriptions: pushSubscriptions.size
      }
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Admin status check failed' }, { status: 500 });
  }
}
