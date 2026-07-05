import Dexie, { type Table } from 'dexie';
import { 
  Club, 
  Member, 
  RosterEntry, 
  Match, 
  Tournament, 
  PredictionPool,
  WalletTransaction
} from '@pitchos/shared-types';

export class PitchOSDatabase extends Dexie {
  clubs!: Table<Club, string>;
  members!: Table<Member, string>;
  roster!: Table<RosterEntry, string>;
  matches!: Table<Match, string>;
  tournaments!: Table<Tournament, string>;
  predictionPools!: Table<PredictionPool, string>;
  transactions!: Table<WalletTransaction, string>;

  constructor() {
    super('PitchOSDatabase');
    
    // Schema version 1
    this.version(1).stores({
      clubs: 'id, name, createdAt',
      members: 'id, did, role, joinedAt',
      roster: 'id, playerId, name, position, guardianDid',
      matches: 'id, clubId, tournamentId, status',
      tournaments: 'id, clubId, name, status',
      predictionPools: 'id, tournamentId, matchId, status'
    });

    // Schema version 2 - Adds local ledger transactions table
    this.version(2).stores({
      clubs: 'id, name, createdAt',
      members: 'id, did, role, joinedAt',
      roster: 'id, playerId, name, position, guardianDid',
      matches: 'id, clubId, tournamentId, status',
      tournaments: 'id, clubId, name, status',
      predictionPools: 'id, tournamentId, matchId, status',
      transactions: 'id, txHash, senderDid, recipientDid, currency, type, timestamp'
    });
  }
}

export const db = new PitchOSDatabase();
export default db;
