import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pitchos';

let pool: Pool | null = null;
let useMock = false;

// In-memory fallback stores for offline/no-DB environments
const mockDb = {
  tournaments: new Map<string, QueryResultRow>(),
  push_subscriptions: new Map<string, QueryResultRow[]>(),
  telemetry_events: [] as QueryResultRow[],
};

try {
  pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 2000,
  });
  pool.on('error', (err) => {
    console.error('Unexpected error on idle pg client, enabling in-memory fallback.', err);
    useMock = true;
  });
} catch (e) {
  console.warn('Could not initialize PG Pool, using in-memory mock database store.', e);
  useMock = true;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  if (useMock || !pool) {
    return runMockQuery<T>(text, params);
  }
  try {
    return await pool.query<T>(text, params);
  } catch (err) {
    console.error('Database query failed. Falling back to mock store.', err);
    useMock = true;
    return runMockQuery<T>(text, params);
  }
}

function runMockQuery<T extends QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const cleanSql = text.replace(/\s+/g, ' ').trim().toLowerCase();
  const res: QueryResult<QueryResultRow> = {
    rows: [],
    rowCount: 0,
    command: '',
    oid: 0,
    fields: []
  };

  if (cleanSql.includes('select * from tournaments') || cleanSql.includes('select id, club_id')) {
    res.rows = Array.from(mockDb.tournaments.values());
    res.rowCount = res.rows.length;
  } else if (cleanSql.includes('insert into tournaments')) {
    if (params) {
      const [id, clubId, name, format, entryFee, isRealMoney, maxParticipants, targetPool, status, teams, fixtures] = params as [
        string,
        string,
        string,
        string,
        number,
        boolean,
        number,
        number,
        string,
        string[],
        string
      ];
      const tournament = {
        id,
        clubId,
        name,
        format,
        entryFee,
        isRealMoney,
        maxParticipants,
        targetPool,
        status,
        teams: Array.isArray(teams) ? teams : [],
        fixtures: typeof fixtures === 'string' ? JSON.parse(fixtures) : fixtures,
        createdAt: Date.now(),
      };
      mockDb.tournaments.set(id, tournament);
      res.rows = [tournament];
      res.rowCount = 1;
    }
  } else if (cleanSql.includes('insert into push_subscriptions')) {
    if (params) {
      const [did, endpoint, p256dh, auth] = params as string[];
      const sub = { did, endpoint, keys: { p256dh, auth } };
      const list = mockDb.push_subscriptions.get(did) || [];
      list.push(sub);
      mockDb.push_subscriptions.set(did, list);
      res.rows = [sub];
      res.rowCount = 1;
    }
  } else if (cleanSql.includes('select * from push_subscriptions') || cleanSql.includes('select did, endpoint')) {
    const list: QueryResultRow[] = [];
    mockDb.push_subscriptions.forEach((val) => list.push(...val));
    res.rows = list;
    res.rowCount = list.length;
  } else if (cleanSql.includes('insert into telemetry_events')) {
    if (params) {
      const [eventName, payload] = params as [string, string];
      const event = {
        eventName,
        payload: typeof payload === 'string' ? JSON.parse(payload) : payload,
        createdAt: Date.now(),
      };
      mockDb.telemetry_events.push(event);
      res.rows = [event];
      res.rowCount = 1;
    }
  }

  return Promise.resolve(res as QueryResult<T>);
}
