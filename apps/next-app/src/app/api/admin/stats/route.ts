import { NextResponse } from 'next/server';
import { challenges } from '../../auth/store';
import { query } from '../../../../lib/db';

const ALLOWED_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']);

export async function GET(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip') || (forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1');

    if (!ALLOWED_IPS.has(realIp) && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Forbidden: Admin access restricted' }, { status: 403 });
    }

    const tournamentCountRes = await query('SELECT COUNT(*) as count FROM tournaments');
    const pushCountRes = await query('SELECT COUNT(*) as count FROM push_subscriptions');

    const cachedTournamentsCount = parseInt(tournamentCountRes.rows[0]?.count || '0', 10);
    const pushSubscriptionsCount = parseInt(pushCountRes.rows[0]?.count || '0', 10);

    return NextResponse.json({
      status: 'healthy',
      timestamp: Date.now(),
      metrics: {
        activeChallenges: challenges.size,
        cachedTournaments: cachedTournamentsCount,
        pushSubscriptions: pushSubscriptionsCount
      }
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Admin status check failed' }, { status: 500 });
  }
}
