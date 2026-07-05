import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';
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
  try {
    const res = await query('SELECT * FROM tournaments ORDER BY created_at DESC');
    const tournaments = res.rows.map(row => ({
      id: row.id,
      clubId: row.club_id || row.clubId,
      name: row.name,
      format: row.format,
      entryFee: row.entry_fee || row.entryFee,
      isRealMoney: row.is_real_money !== undefined ? row.is_real_money : row.isRealMoney,
      maxParticipants: row.max_participants || row.maxParticipants,
      targetPool: row.target_pool || row.targetPool,
      status: row.status,
      teams: row.teams,
      fixtures: typeof row.fixtures === 'string' ? JSON.parse(row.fixtures) : row.fixtures,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : row.createdAt
    }));
    return NextResponse.json({ tournaments });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
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

    await query(
      `INSERT INTO tournaments (
        id, club_id, name, format, entry_fee, is_real_money, max_participants, target_pool, status, teams, fixtures
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        club_id = EXCLUDED.club_id,
        name = EXCLUDED.name,
        format = EXCLUDED.format,
        entry_fee = EXCLUDED.entry_fee,
        is_real_money = EXCLUDED.is_real_money,
        max_participants = EXCLUDED.max_participants,
        target_pool = EXCLUDED.target_pool,
        status = EXCLUDED.status,
        teams = EXCLUDED.teams,
        fixtures = EXCLUDED.fixtures,
        updated_at = CURRENT_TIMESTAMP`,
      [
        tournament.id,
        tournament.clubId,
        tournament.name,
        tournament.format,
        tournament.entryFee,
        tournament.isRealMoney,
        tournament.maxParticipants,
        tournament.targetPool || 0,
        tournament.status,
        tournament.teams || [],
        JSON.stringify(tournament.fixtures || [])
      ]
    );

    return NextResponse.json({ status: 'success', tournamentId: tournament.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Publish failed' }, { status: 500 });
  }
}
