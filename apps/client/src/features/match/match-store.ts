import { db } from '../../lib/db';
import { Match, MatchEvent, MatchEventType } from '@pitchos/shared-types';
import { localCore, activeDid } from '../club/club-store';

export async function createNewMatch(
  clubId: string, 
  homeTeam: string, 
  awayTeam: string, 
  tournamentId?: string
): Promise<Match> {
  if (!localCore || !activeDid) {
    throw new Error('Sync not initialized. Connect to a sync swarm first.');
  }

  const match: Match = {
    id: Math.random().toString(36).substring(2, 9),
    clubId,
    tournamentId,
    homeTeam,
    awayTeam,
    status: 'scheduled',
    events: [],
    score: { home: 0, away: 0 }
  };

  await localCore.append(activeDid, {
    type: 'create_match',
    data: { match }
  }, `sig_${activeDid}`);

  return match;
}

export async function startMatch(matchId: string): Promise<void> {
  if (!localCore || !activeDid) {
    throw new Error('Sync not initialized.');
  }

  const startedAt = Date.now();
  await localCore.append(activeDid, {
    type: 'update_match_status',
    data: { matchId, status: 'live', startedAt }
  }, `sig_${activeDid}`);
}

export async function logMatchEvent(
  matchId: string,
  type: MatchEventType,
  minute: number,
  playerId?: string,
  playerOutId?: string,
  details?: string
): Promise<void> {
  if (!localCore || !activeDid) {
    throw new Error('Sync not initialized.');
  }

  // Generate lamport/causal clock based on event array length or sequence
  const match = await db.matches.get(matchId);
  const causalClock = match ? match.events.length + 1 : Date.now();

  const event: MatchEvent = {
    id: Math.random().toString(36).substring(2, 9),
    type,
    minute,
    playerId,
    playerOutId,
    details,
    timestamp: Date.now(),
    causalClock,
    loggedByDid: activeDid
  };

  await localCore.append(activeDid, {
    type: 'add_match_event',
    data: { matchId, event }
  }, `sig_${activeDid}`);
}

export async function endMatch(
  matchId: string, 
  finalResult: Match['finalResult']
): Promise<void> {
  if (!localCore || !activeDid) {
    throw new Error('Sync not initialized.');
  }

  await localCore.append(activeDid, {
    type: 'end_match',
    data: { matchId, finalResult }
  }, `sig_${activeDid}`);
}
