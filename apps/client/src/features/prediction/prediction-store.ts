import { db } from '../../lib/db';
import { PredictionPool, Prediction } from '@pitchos/shared-types';
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
    predictions: { match_winner: [] },
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
  selection: string
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

  // Check if already placed a prediction
  const currentPredictions = pool.predictions.match_winner || [];
  if (currentPredictions.some(p => p.participantDid === activeDid)) {
    throw new Error('You have already submitted a prediction for this pool');
  }

  if (wallet.points < pool.entryFee) {
    throw new Error('Insufficient points balance');
  }

  // Deduct fee
  wallet.points -= pool.entryFee;
  saveLocalWallet(wallet);

  const prediction: Prediction = {
    id: Math.random().toString(36).substring(2, 9),
    participantDid: activeDid,
    marketType: 'match_winner',
    selection,
    submittedAt: Date.now()
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

  // Calculate actual result
  const homeScore = match.score?.home ?? 0;
  const awayScore = match.score?.away ?? 0;
  const actualOutcome = homeScore > awayScore 
    ? 'home' 
    : homeScore < awayScore 
      ? 'away' 
      : 'draw';

  const predictions = pool.predictions.match_winner || [];
  
  // Find winners
  const winners = predictions
    .filter(p => p.selection === actualOutcome)
    .map(p => p.participantDid);

  // Distribute payouts
  const totalPool = pool.targetPool;
  const payouts: Record<string, number> = {};

  if (winners.length > 0) {
    const share = Math.floor(totalPool / winners.length);
    winners.forEach(w => {
      payouts[w] = share;
    });
  }

  await localCore.append(activeDid, {
    type: 'resolve_prediction_pool',
    data: {
      poolId,
      winners,
      resolution: {
        finalResult: actualOutcome,
        payouts
      }
    }
  }, `sig_${activeDid}`);
}
