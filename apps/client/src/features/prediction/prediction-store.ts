import { db } from '../../lib/db';
import { PredictionPool, Prediction, PredictionMarketType } from '@pitchos/shared-types';
import { localCore, activeDid } from '../club/club-store';
import { getLocalWallet, saveLocalWallet } from '../wallet/wallet-store';

export async function createNewPredictionPool(
  matchId: string,
  name: string,
  entryFee: number,
  maxParticipants: number
): Promise<PredictionPool> {
  if (!localCore || !activeDid) {
    throw new Error('Sync not initialized.');
  }

  const pool: PredictionPool = {
    id: Math.random().toString(36).substring(2, 9),
    matchId,
    name,
    mode: 'points',
    entryFee,
    maxParticipants,
    targetPool: 0,
    predictions: {
      match_winner: [],
      correct_score: [],
      total_goals: [],
      btts: []
    },
    status: 'open'
  };

  await localCore.append(activeDid, {
    type: 'create_prediction_pool',
    data: { pool }
  }, `sig_${activeDid}`);

  return pool;
}

export async function submitPoolPrediction(
  poolId: string,
  selection: string,
  marketType: PredictionMarketType = 'match_winner'
): Promise<void> {
  if (!localCore || !activeDid) {
    throw new Error('Sync not initialized.');
  }

  const wallet = getLocalWallet();
  if (!wallet) {
    throw new Error('Wallet not initialized.');
  }

  const pool = await db.predictionPools.get(poolId);
  if (!pool) {
    throw new Error('Prediction pool not found');
  }

  // Check if already placed a prediction in this specific marketType
  const currentPredictions = pool.predictions[marketType] || [];
  if (currentPredictions.some(p => p.participantDid === activeDid)) {
    throw new Error(`You have already submitted a prediction in the ${marketType} market.`);
  }

  // Calculate dynamic balances from ledger
  const { getWalletBalances, createTransaction } = await import('../wallet/wallet-store');
  const balances = await getWalletBalances(wallet.did);

  if (balances.points < pool.entryFee) {
    throw new Error('Insufficient points balance');
  }

  // Submit prediction entry fee transaction on the ledger
  const tx = await createTransaction(
    wallet.did,
    `did:pitchos:prediction_pool:${poolId}`,
    pool.entryFee,
    'Points',
    'entry_fee',
    wallet.privateKeyHex
  );
  const signedTxRef = tx.txHash;

  const prediction: Prediction = {
    id: Math.random().toString(36).substring(2, 9),
    participantDid: activeDid,
    marketType,
    selection,
    submittedAt: Date.now(),
    signedTxRef
  };

  await localCore.append(activeDid, {
    type: 'submit_prediction',
    data: { poolId, prediction }
  }, `sig_${activeDid}`);
}

export async function resolvePredictionPool(
  poolId: string
): Promise<void> {
  if (!localCore || !activeDid) {
    throw new Error('Sync not initialized.');
  }

  const pool = await db.predictionPools.get(poolId);
  if (!pool) {
    throw new Error('Pool not found');
  }

  if (!pool.matchId) {
    throw new Error('No associated match for this pool');
  }

  const match = await db.matches.get(pool.matchId);
  if (!match || match.status !== 'completed') {
    throw new Error('Associated match is not completed yet');
  }

  const homeScore = match.score?.home ?? 0;
  const awayScore = match.score?.away ?? 0;
  const totalGoals = homeScore + awayScore;

  // Outcomes for each supported market type
  const outcomes = {
    match_winner: homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw',
    correct_score: `${homeScore}-${awayScore}`,
    total_goals: totalGoals > 2.5 ? 'over_2.5' : 'under_2.5',
    btts: (homeScore > 0 && awayScore > 0) ? 'yes' : 'no'
  };

  const payouts: Record<string, number> = {};
  const winners: string[] = [];

  // Process all prediction markets registered in this pool
  for (const [marketKey, predictions] of Object.entries(pool.predictions)) {
    if (!predictions || predictions.length === 0) continue;

    const actualOutcome = outcomes[marketKey as keyof typeof outcomes];
    if (!actualOutcome) continue;

    const marketWinners = predictions.filter(
      p => p.selection.trim().toLowerCase() === actualOutcome.toLowerCase()
    );

    const marketPoolSize = pool.entryFee * predictions.length;

    if (marketWinners.length > 0) {
      const share = Math.floor(marketPoolSize / marketWinners.length);
      marketWinners.forEach(w => {
        winners.push(w.participantDid);
        payouts[w.participantDid] = (payouts[w.participantDid] || 0) + share;
      });
    } else {
      // Refund if no winners in this market category
      predictions.forEach(p => {
        payouts[p.participantDid] = (payouts[p.participantDid] || 0) + pool.entryFee;
      });
    }
  }

  await localCore.append(activeDid, {
    type: 'resolve_prediction_pool',
    data: {
      poolId,
      winners: Array.from(new Set(winners)),
      resolution: {
        finalResult: `${homeScore}-${awayScore}`,
        payouts
      }
    }
  }, `sig_${activeDid}`);
}
