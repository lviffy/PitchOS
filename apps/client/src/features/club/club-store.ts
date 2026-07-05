import { db } from '../../lib/db';
import { Club, Member, RosterEntry } from '@pitchos/shared-types';
import { HypercoreMock, P2PClient } from '@pitchos/sync-adapter';

// Global instances for active session P2P synchronization
export let localCore: HypercoreMock | null = null;
export let p2pClient: P2PClient | null = null;
export let activeDid: string | null = null;

export function getActiveSyncSession() {
  return { localCore, activeDid, p2pClient };
}

export interface AttendanceRecord {
  date: string;
  playerIds: string[];
}

export function initClubSync(
  did: string, 
  topic: string, 
  onUpdate: () => void, 
  onConnectionChange?: (connected: boolean) => void
): () => void {
  activeDid = did;
  console.log(`[ClubStore] Initializing P2P Sync for DID: ${did}, topic: ${topic}`);

  // Setup local append-only log core
  localCore = new HypercoreMock(topic);
  
  // Wire websocket client to local core
  const relayUrl = process.env.NEXT_PUBLIC_RELAY_URL || 'ws://localhost:3001';
  p2pClient = new P2PClient(relayUrl, did, topic, localCore);
  p2pClient.connect(onConnectionChange);

  // Subscribe to core updates to apply events into local IndexedDB
  const unsubscribe = localCore.subscribe(async (entry) => {
    try {
      const { type, data } = entry.payload;
      console.log(`[ClubStore] Processing sync event: ${type}`, data);

      switch (type) {
        case 'create_club':
          await db.clubs.put(data.club);
          break;
        case 'add_member':
          await db.members.put(data.member);
          break;
        case 'add_player':
          await db.roster.put(data.player);
          break;
        case 'update_attendance': {
          const records = getStoredAttendance();
          records[data.date] = data.playerIds;
          localStorage.setItem('pitchos_attendance', JSON.stringify(records));
          break;
        }
        case 'create_match':
          await db.matches.put(data.match);
          break;
        case 'update_match_status': {
          const match = await db.matches.get(data.matchId);
          if (match) {
            match.status = data.status;
            if (data.startedAt) match.startedAt = data.startedAt;
            await db.matches.put(match);
          }
          break;
        }
        case 'add_match_event': {
          const match = await db.matches.get(data.matchId);
          if (match) {
            if (!match.events.some(e => e.id === data.event.id)) {
              match.events.push(data.event);
              match.events.sort((a, b) => a.causalClock - b.causalClock || a.timestamp - b.timestamp);
              
              let home = 0;
              let away = 0;
              match.events.forEach(e => {
                if (e.type === 'goal') {
                  if (e.details === 'home') home++;
                  if (e.details === 'away') away++;
                }
              });
              match.score = { home, away };
              await db.matches.put(match);
            }
          }
          break;
        }
        case 'end_match': {
          const match = await db.matches.get(data.matchId);
          if (match) {
            match.status = 'completed';
            match.finalResult = data.finalResult;
            if (data.finalResult) {
              match.score = {
                home: data.finalResult.scoreHome,
                away: data.finalResult.scoreAway
              };
            }
            await db.matches.put(match);
            if (match.tournamentId) {
              const { advanceTournamentFixture } = await import('../tournament/tournament-store');
              await advanceTournamentFixture(match.tournamentId, match);
            }
          }
          break;
        }
        case 'create_tournament':
          await db.tournaments.put(data.tournament);
          break;
        case 'register_team': {
          const tournament = await db.tournaments.get(data.tournamentId);
          if (tournament) {
            if (!tournament.teams.includes(data.teamName)) {
              tournament.teams.push(data.teamName);
              await db.tournaments.put(tournament);
            }
          }
          break;
        }
        case 'update_tournament_status': {
          const tournament = await db.tournaments.get(data.tournamentId);
          if (tournament) {
            tournament.status = data.status;
            if (data.fixtures) {
              tournament.fixtures = data.fixtures;
            }
            await db.tournaments.put(tournament);
          }
          break;
        }
        case 'create_prediction_pool':
          await db.predictionPools.put(data.pool);
          break;
        case 'submit_prediction': {
          const pool = await db.predictionPools.get(data.poolId);
          if (pool) {
            const market = data.prediction.marketType;
            if (!pool.predictions[market]) {
              pool.predictions[market] = [];
            }
            if (!pool.predictions[market].some(p => p.id === data.prediction.id)) {
              pool.predictions[market].push(data.prediction);
              pool.targetPool += pool.entryFee;
              await db.predictionPools.put(pool);
            }
          }
          break;
        }
        case 'resolve_prediction_pool': {
          const pool = await db.predictionPools.get(data.poolId);
          if (pool) {
            pool.status = 'resolved';
            pool.winners = data.winners;
            pool.resolution = data.resolution;
            await db.predictionPools.put(pool);
            const { getLocalWallet, saveLocalWallet } = await import('../wallet/wallet-store');
            const wallet = getLocalWallet();
            if (wallet && data.resolution.payouts[wallet.did]) {
              wallet.points += data.resolution.payouts[wallet.did];
              saveLocalWallet(wallet);
            }
          }
          break;
        }
      }
      onUpdate();
    } catch (err) {
      console.error('[ClubStore] Error applying sync event', err);
    }
  });

  return () => {
    unsubscribe();
    p2pClient?.disconnect();
    p2pClient = null;
    localCore = null;
  };
}

export function getStoredAttendance(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem('pitchos_attendance');
  return data ? JSON.parse(data) : {};
}

export async function createNewClub(name: string, location?: string, ageCategory?: string): Promise<Club> {
  if (!localCore || !activeDid) {
    throw new Error('P2P Sync not initialized. Setup wallet and join topic first.');
  }

  const club: Club = {
    id: Math.random().toString(36).substring(2, 9),
    name,
    location,
    ageCategory,
    createdAt: Date.now()
  };

  // 1. Append locally & broadcast to peers
  await localCore.append(activeDid, {
    type: 'create_club',
    data: { club }
  }, `sig_${activeDid}`);

  // 2. Add creator as Owner member
  const member: Member = {
    id: Math.random().toString(36).substring(2, 9),
    did: activeDid,
    role: 'owner',
    joinedAt: Date.now()
  };

  await localCore.append(activeDid, {
    type: 'add_member',
    data: { member }
  }, `sig_${activeDid}`);

  return club;
}

export async function addRosterPlayer(
  clubId: string,
  name: string,
  position: string,
  jerseyNumber?: number,
  guardianDid?: string,
  emergencyContactName?: string,
  emergencyContactPhone?: string
): Promise<RosterEntry> {
  if (!localCore || !activeDid) {
    throw new Error('P2P Sync not initialized.');
  }

  const player: RosterEntry = {
    id: Math.random().toString(36).substring(2, 9),
    playerId: Math.random().toString(36).substring(2, 9),
    name,
    position,
    jerseyNumber,
    guardianDid,
    consentFlags: {
      photoConsent: true,
      dataShareConsent: true,
      minorSafetyConsent: true
    },
    emergencyContact: emergencyContactName && emergencyContactPhone ? {
      name: emergencyContactName,
      phone: emergencyContactPhone,
      relation: 'Guardian'
    } : undefined
  };

  await localCore.append(activeDid, {
    type: 'add_player',
    data: { player }
  }, `sig_${activeDid}`);

  return player;
}

export async function recordAttendance(date: string, playerIds: string[]): Promise<void> {
  if (!localCore || !activeDid) {
    throw new Error('P2P Sync not initialized.');
  }

  await localCore.append(activeDid, {
    type: 'update_attendance',
    data: { date, playerIds }
  }, `sig_${activeDid}`);
}
