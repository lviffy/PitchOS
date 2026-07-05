import Dexie, { type Table } from 'dexie';
import { 
  Club, 
  Member, 
  RosterEntry, 
  Match, 
  Tournament, 
  PredictionPool 
} from '@pitchos/shared-types';

export class PitchOSDatabase extends Dexie {
  clubs!: Table<Club, string>;
  members!: Table<Member, string>;
  roster!: Table<RosterEntry, string>;
  matches!: Table<Match, string>;
  tournaments!: Table<Tournament, string>;
  predictionPools!: Table<PredictionPool, string>;

  constructor() {
    super('PitchOSDatabase');
    this.version(1).stores({
      clubs: 'id, name, createdAt',
      members: 'id, did, role, joinedAt',
      roster: 'id, playerId, name, position, guardianDid',
      matches: 'id, clubId, tournamentId, status',
      tournaments: 'id, clubId, name, status',
      predictionPools: 'id, tournamentId, matchId, status'
    });
  }
}

export const db = new PitchOSDatabase();
export default db;
