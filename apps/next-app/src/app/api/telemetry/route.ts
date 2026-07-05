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

    return NextResponse.json({ status: 'logged' }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const res = await query(
      'SELECT id, event_name as "eventName", payload, created_at as "createdAt" FROM telemetry_events ORDER BY id DESC LIMIT 20'
    );
    
    const logs = res.rows.map((row: any) => {
      let parsedPayload = {};
      try {
        parsedPayload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      } catch {}
      return {
        id: row.id,
        eventName: row.eventName,
        payload: parsedPayload,
        createdAt: row.createdAt || new Date().toISOString()
      };
    });

    return NextResponse.json(logs, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Telemetry read failed' }, { status: 500 });
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
