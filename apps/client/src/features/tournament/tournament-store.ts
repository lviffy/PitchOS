import { db } from '../../lib/db';
import { Tournament, TournamentFormat, Fixture, Match } from '@pitchos/shared-types';
import { localCore, activeDid } from '../club/club-store';
import { getLocalWallet, saveLocalWallet } from '../wallet/wallet-store';
import { signMessage } from '@pitchos/wallet-adapter';
import { createNewMatch } from '../match/match-store';

export async function createNewTournament(
  clubId: string,
  name: string,
  format: TournamentFormat,
  entryFee: number,
  maxParticipants: number,
  isRealMoney: boolean = false
): Promise<Tournament> {
  if (!localCore || !activeDid) {
    throw new Error('Sync not initialized.');
  }

  const tournament: Tournament = {
    id: Math.random().toString(36).substring(2, 9),
    clubId,
    name,
    format,
    entryFee,
    isRealMoney,
    maxParticipants,
    status: 'registration',
    teams: [],
    fixtures: [],
    createdAt: Date.now()
  };

  await localCore.append(activeDid, {
    type: 'create_tournament',
    data: { tournament }
  }, `sig_${activeDid}`);

  return tournament;
}

export async function registerTeamInTournament(
  tournamentId: string,
  teamName: string
): Promise<void> {
  if (!localCore || !activeDid) {
    throw new Error('Sync not initialized.');
  }

  const wallet = getLocalWallet();
  if (!wallet) {
    throw new Error('Wallet not initialized. Create wallet first.');
  }

  const tournament = await db.tournaments.get(tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  if (tournament.teams.includes(teamName)) {
    throw new Error('Team already registered');
  }

  // Calculate dynamic balances from ledger
  const { getWalletBalances, createTransaction } = await import('../wallet/wallet-store');
  const balances = await getWalletBalances(wallet.did);

  if (tournament.isRealMoney) {
    if (balances.balance < tournament.entryFee) {
      throw new Error('Insufficient USDT balance');
    }
  } else {
    if (balances.points < tournament.entryFee) {
      throw new Error('Insufficient Points balance');
    }
  }

  // Submit payment transaction on the ledger
  const tx = await createTransaction(
    wallet.did,
    `did:pitchos:tournament:${tournamentId}`,
    tournament.entryFee,
    tournament.isRealMoney ? 'USDT' : 'Points',
    'entry_fee',
    wallet.privateKeyHex
  );
  const signedTxRef = tx.txHash;

  // Broadcast registration
  await localCore.append(activeDid, {
    type: 'register_team',
    data: {
      tournamentId,
      teamName,
      participantDid: activeDid,
      signedTxRef
    }
  }, `sig_${activeDid}`);
}

export async function generateTournamentBrackets(
  tournamentId: string
): Promise<void> {
  if (!localCore || !activeDid) {
    throw new Error('Sync not initialized.');
  }

  const tournament = await db.tournaments.get(tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const teams = tournament.teams;
  if (teams.length < 2) {
    throw new Error('Need at least 2 teams to generate brackets');
  }

  // Generate round-1 matchups (pairs of teams)
  const fixtures: Fixture[] = [];
  const clubId = tournament.clubId;

  // Let's create matches in IndexedDB first or broadcast create_match logs.
  // In a clean event log model, we create matches one by one and reference them.
  for (let i = 0; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      const teamA = teams[i];
      const teamB = teams[i + 1];
      
      // Create match
      const match = await createNewMatch(clubId, teamA, teamB, tournamentId);
      
      fixtures.push({
        id: Math.random().toString(36).substring(2, 9),
        matchId: match.id,
        round: 1,
        stageName: `Semi-Finals`
      });
    } else {
      // Bye / odd number of teams: for MVP knockout we assume power of 2 (e.g. 4 or 8)
      // If odd, we can match with a placeholder
      const teamA = teams[i];
      const match = await createNewMatch(clubId, teamA, 'BYE', tournamentId);
      fixtures.push({
        id: Math.random().toString(36).substring(2, 9),
        matchId: match.id,
        round: 1,
        stageName: `Semi-Finals (Bye)`
      });
    }
  }

  await localCore.append(activeDid, {
    type: 'update_tournament_status',
    data: {
      tournamentId,
      status: 'active',
      fixtures
    }
  }, `sig_${activeDid}`);
}

export async function advanceTournamentFixture(
  tournamentId: string,
  completedMatch: Match
): Promise<void> {
  if (!localCore || !activeDid) return;

  const tournament = await db.tournaments.get(tournamentId);
  if (!tournament || tournament.status !== 'active') return;

  const matchId = completedMatch.id;
  const fixtures = tournament.fixtures;

  const currentFixtureIdx = fixtures.findIndex(f => f.matchId === matchId);
  if (currentFixtureIdx === -1) return;

  const currentFixture = fixtures[currentFixtureIdx];
  const round = currentFixture.round;



  // If round 1 semi-finals, we look for the other semi-final fixture
  // to create the final match
  if (round === 1) {
    const finishedRoundFixtures = await Promise.all(
      fixtures
        .filter(f => f.round === 1)
        .map(async f => {
          const m = await db.matches.get(f.matchId);
          return { fixture: f, match: m };
        })
    );

    const allFinished = finishedRoundFixtures.every(item => item.match && item.match.status === 'completed');
    
    // Check if the final fixture for round 2 has already been generated
    const hasRound2 = fixtures.some(f => f.round === 2);

    if (allFinished && !hasRound2) {
      // Collect winners from semi-finals
      const winners: string[] = [];
      for (const item of finishedRoundFixtures) {
        if (item.match) {
          const hs = item.match.score?.home ?? 0;
          const aw = item.match.score?.away ?? 0;
          const w = hs > aw ? item.match.homeTeam : item.match.awayTeam;
          winners.push(w);
        }
      }

      if (winners.length >= 2) {
        // Create Final Match
        const finalMatch = await createNewMatch(tournament.clubId, winners[0], winners[1], tournamentId);
        const updatedFixtures = [
          ...fixtures,
          {
            id: Math.random().toString(36).substring(2, 9),
            matchId: finalMatch.id,
            round: 2,
            stageName: 'Grand Final'
          }
        ];

        await localCore.append(activeDid, {
          type: 'update_tournament_status',
          data: {
            tournamentId,
            status: 'active',
            fixtures: updatedFixtures
          }
        }, `sig_${activeDid}`);
      } else if (winners.length === 1) {
        // Only 1 winner (e.g. 2-team tournament)
        // Tournament completed!
        await localCore.append(activeDid, {
          type: 'update_tournament_status',
          data: {
            tournamentId,
            status: 'completed',
            fixtures
          }
        }, `sig_${activeDid}`);
      }
    }
  } else if (round === 2) {
    // Grand Final completed
    await localCore.append(activeDid, {
      type: 'update_tournament_status',
      data: {
        tournamentId,
        status: 'completed',
        fixtures
      }
    }, `sig_${activeDid}`);
  }
}
