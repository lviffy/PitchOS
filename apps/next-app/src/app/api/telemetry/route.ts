import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function POST(request: Request) {
  try {
    const { eventName, payload } = await request.json();
    if (!eventName || !payload) {
      return NextResponse.json({ error: 'Missing telemetry event parameters' }, { status: 400 });
    }

    // Insert telemetry record
    await query(
      'INSERT INTO telemetry_events (event_name, payload) VALUES ($1, $2)',
      [eventName, JSON.stringify(payload)]
    );

    return NextResponse.json({ status: 'logged' });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
