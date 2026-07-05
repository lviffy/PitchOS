'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PredictionPool, Match, PredictionMarketType } from '@pitchos/shared-types';
import { db } from '../../lib/db';
import { createNewPredictionPool, submitPoolPrediction, resolvePredictionPool } from './prediction-store';
import { generatePredictionRationale, PredictionRationale } from '../ai/qvac-service';

export default function PredictionView() {
  const [pools, setPools] = useState<PredictionPool[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activePool, setActivePool] = useState<PredictionPool | null>(null);

  // Use refs to avoid dependency loops
  const activePoolIdRef = useRef<string | null>(null);
  activePoolIdRef.current = activePool?.id ?? null;
  const matchesRef = useRef<Match[]>([]);
  matchesRef.current = matches;

  // Form states
  const [poolName, setPoolName] = useState('');
  const [matchId, setMatchId] = useState('');
  const [entryFee, setEntryFee] = useState('100');
  const [maxParticipants, setMaxParticipants] = useState('50');

  // Submit prediction selection & market
  const [activeMarket, setActiveMarket] = useState<PredictionMarketType>('match_winner');
  const [selection, setSelection] = useState('home');

  // QVAC Rationale states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState<PredictionRationale | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refreshData = useCallback(async () => {
    try {
      const allPools = await db.predictionPools.toArray();
      setPools(allPools);

      const allMatches = await db.matches.toArray();
      setMatches(allMatches);

      const currentActiveId = activePoolIdRef.current;
      if (currentActiveId) {
        const freshActive = allPools.find(p => p.id === currentActiveId);
        if (freshActive) setActivePool(freshActive);
      }
    } catch (err) {
      console.error(err);
    }
  }, []); // No dependencies — uses ref for active ID

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Generate AI rationale when active pool changes (by ID, not object reference)
  const activePoolId = activePool?.id;
  const activePoolStatus = activePool?.status;
  const activePoolMatchId = activePool?.matchId;

  useEffect(() => {
    if (!activePoolId || activePoolStatus !== 'open') {
      setAiRationale(null);
      return;
    }

    let cancelled = false;

    const loadRationale = async () => {
      setAiLoading(true);
      setAiRationale(null);
      try {
        const match = matchesRef.current.find(m => m.id === activePoolMatchId);
        if (match && !cancelled) {
          const rationale = await generatePredictionRationale(match.homeTeam, match.awayTeam);
          if (!cancelled) setAiRationale(rationale);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    };

    loadRationale();
    return () => { cancelled = true; };
  }, [activePoolId, activePoolStatus, activePoolMatchId]);

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolName.trim() || !matchId) {
      setError('Pool name and match selection required');
      return;
    }

    setError('');
    setSuccess('');
    try {
      const pool = await createNewPredictionPool(
        matchId,
        poolName,
        parseInt(entryFee, 10),
        parseInt(maxParticipants, 10)
      );
      setSuccess(`Prediction pool "${pool.name}" created!`);
      setPoolName('');
      setMatchId('');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create pool');
    }
  };

  const handleSubmitPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePool) return;

    setError('');
    setSuccess('');
    try {
      await submitPoolPrediction(activePool.id, selection, activeMarket);
      setSuccess('Prediction submitted successfully! Entry fee points escrowed.');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit prediction');
    }
  };

  const handleResolvePool = async () => {
    if (!activePool) return;
    setError('');
    setSuccess('');
    try {
      await resolvePredictionPool(activePool.id);
      setSuccess('Prediction pool resolved successfully and payouts distributed!');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resolve pool');
    }
  };

  const getMatchDisplay = (mId?: string) => {
    const match = matches.find(m => m.id === mId);
    return match ? `${match.homeTeam} vs ${match.awayTeam}` : 'Unknown Match';
  };

  const getMatchStatus = (mId?: string) => {
    const match = matches.find(m => m.id === mId);
    return match ? match.status : 'unknown';
  };

  const predictionsList = activePool?.predictions[activeMarket] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Create Pool & List Pools */}
      <div className="lg:col-span-1 space-y-6">
        {/* Create Pool Form */}
        <div className="bg-card-dark border border-border-dark rounded-xl p-6">
          <h3 className="font-sans text-xl font-bold text-text-primary mb-4">Initialize Prediction Circle</h3>
          <form onSubmit={handleCreatePool} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Pool Name</label>
              <input
                type="text"
                required
                placeholder="e.g. London Wolves Derby Pool"
                value={poolName}
                onChange={e => setPoolName(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Select Match</label>
              <select
                required
                value={matchId}
                onChange={e => setMatchId(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
              >
                <option value="">-- Choose Match --</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>{m.homeTeam} vs {m.awayTeam} ({m.status})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Entry Fee (Pts)</label>
                <input
                  type="number"
                  required
                  value={entryFee}
                  onChange={e => setEntryFee(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Max Players</label>
                <input
                  type="number"
                  required
                  value={maxParticipants}
                  onChange={e => setMaxParticipants(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-green hover:bg-primary-green-hover text-white font-medium py-2 rounded-xl transition duration-200"
            >
              Create Prediction Pool
            </button>
          </form>
        </div>

        {/* Prediction Pools List */}
        <div className="bg-card-dark border border-border-dark rounded-xl p-6">
          <h3 className="font-sans text-xl font-bold text-text-primary mb-4">Active Pools</h3>
          {pools.length === 0 ? (
            <div className="text-center py-6 bg-bg-dark border border-border-dark rounded-xl">
              <span className="text-xs text-text-secondary">No prediction pools active yet.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {pools.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePool(p);
                  }}
                  className={`w-full text-left bg-bg-dark hover:bg-card-hover border px-4 py-3.5 rounded-xl transition flex items-center justify-between group ${
                    activePool?.id === p.id ? 'border-primary-green' : 'border-border-dark'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block text-text-primary">{p.name}</span>
                    <span className="text-xs text-text-secondary uppercase tracking-widest font-semibold block mt-0.5">
                      Fee: {p.entryFee} PTS | Pool: {p.targetPool} PTS
                    </span>
                  </div>
                  <span className={`text-[11px] uppercase font-bold px-2 py-0.5 rounded border ${
                    p.status === 'open'
                      ? 'bg-primary-green bg-opacity-10 text-primary-green border-primary-green border-opacity-20 animate-pulse'
                      : 'bg-border-dark text-text-secondary border-border-dark'
                  }`}>
                    {p.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Prediction Workspace */}
      <div className="lg:col-span-2 space-y-6">
        {error && (
          <div className="bg-pitch-red bg-opacity-10 border border-pitch-red border-opacity-20 text-pitch-red text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-primary-green bg-opacity-10 border border-primary-green border-opacity-20 text-primary-green text-sm px-4 py-3 rounded-xl animate-fadeIn">
            {success}
          </div>
        )}

        {!activePool ? (
          <div className="bg-card-dark border border-border-dark rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-border-dark flex items-center justify-center mx-auto mb-4 text-text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h3 className="font-sans text-xl font-bold text-text-primary">Prediction Pool Dashboard</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">
              Select an active prediction pool from the side-panel to place predictions, query AI rationale, and resolve points payouts.
            </p>
          </div>
        ) : (
          <div className="bg-card-dark border border-border-dark rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border-dark pb-4">
              <div>
                <h3 className="font-sans text-2xl font-bold text-text-primary">{activePool.name}</h3>
                <span className="text-xs text-text-secondary">
                  Match: <span className="text-primary-green font-semibold">{getMatchDisplay(activePool.matchId)}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-text-secondary block font-bold uppercase tracking-wider">Escrowed Pool Size</span>
                <span className="text-lg font-bold text-pitch-gold">{activePool.targetPool} PTS</span>
              </div>
            </div>

            {/* QVAC AI Prediction Assistant (Shows when pool is open) */}
            {activePool.status === 'open' && (
              <div className="bg-bg-dark border border-border-dark rounded-xl p-5 space-y-4">
                <h4 className="font-sans text-sm font-bold text-primary-green flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pitch-gold animate-pulse"></span>
                  QVAC AI Prediction Assistant
                </h4>

                {aiLoading ? (
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <div className="w-4 h-4 border-2 border-primary-green border-t-transparent rounded-full animate-spin"></div>
                    Running local QVAC prediction rationale...
                  </div>
                ) : aiRationale ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-card-dark border border-border-dark p-2.5 rounded-lg text-center">
                        <span className="text-[11px] text-text-secondary uppercase block">Home Win</span>
                        <span className="text-sm font-bold text-text-primary">{aiRationale.homeProbability}%</span>
                      </div>
                      <div className="bg-card-dark border border-border-dark p-2.5 rounded-lg text-center">
                        <span className="text-[11px] text-text-secondary uppercase block">Draw</span>
                        <span className="text-sm font-bold text-text-primary">{aiRationale.drawProbability}%</span>
                      </div>
                      <div className="bg-card-dark border border-border-dark p-2.5 rounded-lg text-center">
                        <span className="text-[11px] text-text-secondary uppercase block">Away Win</span>
                        <span className="text-sm font-bold text-text-primary">{aiRationale.awayProbability}%</span>
                      </div>
                    </div>

                    <div className="bg-card-dark border border-border-dark p-3.5 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-text-secondary uppercase font-semibold">Inference Confidence</span>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          aiRationale.confidence === 'High' 
                            ? 'bg-primary-green bg-opacity-10 text-primary-green' 
                            : 'bg-pitch-gold bg-opacity-10 text-pitch-gold'
                        }`}>
                          {aiRationale.confidence}
                        </span>
                      </div>
                      <div className="border-t border-border-dark pt-2 space-y-1.5">
                        <span className="text-[11px] text-text-secondary uppercase font-semibold block">Key Rationale Reasons:</span>
                        <ul className="list-disc pl-4 space-y-1 text-text-primary">
                          {aiRationale.reasons.map((r, idx) => (
                            <li key={idx} className="leading-relaxed">{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-text-secondary">
                    Select a match in active status to see local QVAC prediction rationale.
                  </div>
                )}
              </div>
            )}

            {/* Market Selection Tabs */}
            <div className="flex border-b border-border-dark overflow-x-auto gap-4 pt-2">
              {(
                [
                  { id: 'match_winner', label: 'Match Winner' },
                  { id: 'correct_score', label: 'Correct Score' },
                  { id: 'total_goals', label: 'Total Goals (2.5)' },
                  { id: 'btts', label: 'Both Teams to Score' }
                ] as const
              ).map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveMarket(m.id);
                    if (m.id === 'match_winner') setSelection('home');
                    else if (m.id === 'correct_score') setSelection('2-1');
                    else if (m.id === 'total_goals') setSelection('over_2.5');
                    else if (m.id === 'btts') setSelection('yes');
                  }}
                  className={`text-xs font-semibold pb-2 border-b-2 transition whitespace-nowrap px-1 ${
                    activeMarket === m.id
                      ? 'border-primary-green text-primary-green'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Prediction Submission Form */}
            {activePool.status === 'open' && (
              <div className="bg-bg-dark border border-border-dark rounded-xl p-5 space-y-4">
                <h4 className="font-sans text-sm font-bold text-text-primary uppercase tracking-wider">
                  Place Prediction in {activeMarket.replace('_', ' ')}
                </h4>
                
                <form onSubmit={handleSubmitPrediction} className="space-y-4">
                  {activeMarket === 'match_winner' && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelection('home')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          selection === 'home' 
                            ? 'bg-primary-green border-primary-green text-white' 
                            : 'bg-card-dark border-border-dark text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Home Win
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelection('draw')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          selection === 'draw' 
                            ? 'bg-primary-green border-primary-green text-white' 
                            : 'bg-card-dark border-border-dark text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Draw
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelection('away')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          selection === 'away' 
                            ? 'bg-primary-green border-primary-green text-white' 
                            : 'bg-card-dark border-border-dark text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Away Win
                      </button>
                    </div>
                  )}

                  {activeMarket === 'correct_score' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-text-secondary uppercase">Enter Expected Score</label>
                      <input
                        type="text"
                        placeholder="e.g. 2-1"
                        required
                        value={selection}
                        onChange={e => setSelection(e.target.value)}
                        className="w-full bg-card-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                      />
                    </div>
                  )}

                  {activeMarket === 'total_goals' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelection('over_2.5')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          selection === 'over_2.5' 
                            ? 'bg-primary-green border-primary-green text-white' 
                            : 'bg-card-dark border-border-dark text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Over 2.5 Goals
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelection('under_2.5')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          selection === 'under_2.5' 
                            ? 'bg-primary-green border-primary-green text-white' 
                            : 'bg-card-dark border-border-dark text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Under 2.5 Goals
                      </button>
                    </div>
                  )}

                  {activeMarket === 'btts' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelection('yes')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          selection === 'yes' 
                            ? 'bg-primary-green border-primary-green text-white' 
                            : 'bg-card-dark border-border-dark text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Yes (Both Score)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelection('no')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                          selection === 'no' 
                            ? 'bg-primary-green border-primary-green text-white' 
                            : 'bg-card-dark border-border-dark text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        No (One/None Score)
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-text-secondary italic">
                      Deducts {activePool.entryFee} PTS from wallet.
                    </span>
                    <button
                      type="submit"
                      className="bg-primary-green hover:bg-primary-green-hover text-white text-xs font-semibold py-2 px-6 rounded-xl transition"
                    >
                      Submit Prediction
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Settle Pool controls */}
            {activePool.status === 'open' && getMatchStatus(activePool.matchId) === 'completed' && (
              <div className="bg-pitch-gold bg-opacity-5 border border-pitch-gold border-opacity-20 rounded-xl p-5 text-center space-y-3">
                <h4 className="font-sans text-sm font-bold text-pitch-gold">Match Finished! Ready to Resolve Payouts</h4>
                <p className="text-xs text-text-secondary">
                  The match results are officially logged in local IndexedDB. You can trigger the points payout process now.
                </p>
                <button
                  onClick={handleResolvePool}
                  className="bg-pitch-gold text-black text-xs font-bold py-2 px-6 rounded-xl transition hover:bg-opacity-80"
                >
                  Distribute Points Escrow
                </button>
              </div>
            )}

            {/* Resolved Status */}
            {activePool.status === 'resolved' && (
              <div className="bg-bg-dark border border-border-dark rounded-xl p-5 space-y-3.5 text-xs">
                <h4 className="font-sans text-sm font-bold text-pitch-gold">Prediction Pool Resolved</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card-dark border border-border-dark p-3.5 rounded-lg text-center">
                    <span className="text-[11px] text-text-secondary uppercase block mb-1">Final Score Result</span>
                    <span className="text-base font-bold text-text-primary uppercase">{activePool.resolution?.finalResult}</span>
                  </div>
                  <div className="bg-card-dark border border-border-dark p-3.5 rounded-lg text-center">
                    <span className="text-[11px] text-text-secondary uppercase block mb-1">Total Winners</span>
                    <span className="text-base font-bold text-primary-green">{activePool.winners?.length ?? 0}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] text-text-secondary uppercase font-semibold block">Payout Ledger:</span>
                  {Object.entries(activePool.resolution?.payouts || {}).length === 0 ? (
                    <span className="text-text-secondary italic">No correct predictions. Escrow refunded or locked.</span>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {Object.entries(activePool.resolution?.payouts || {}).map(([did, amt]) => (
                        <div key={did} className="bg-card-dark border border-border-dark px-3 py-2 rounded-lg flex justify-between font-mono">
                          <span className="truncate max-w-[150px]">{did}</span>
                          <span className="text-pitch-gold font-bold font-mono">+{amt} PTS</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Participants Ledger list */}
            <div className="space-y-3">
              <h4 className="font-sans text-sm font-bold text-text-primary uppercase tracking-wider">
                Placed Predictions for {activeMarket.replace('_', ' ')} ({predictionsList.length})
              </h4>
              {predictionsList.length === 0 ? (
                <div className="text-center py-4 bg-bg-dark border border-border-dark rounded-xl">
                  <span className="text-xs text-text-secondary">No predictions placed for this market.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {predictionsList.map((p, idx) => (
                    <div key={idx} className="bg-bg-dark border border-border-dark px-4 py-2.5 rounded-xl flex justify-between items-center text-xs">
                      <span className="font-mono text-text-secondary truncate max-w-[200px]">{p.participantDid}</span>
                      <span className="font-bold text-primary-green capitalize">
                        {p.selection === 'home' 
                          ? 'Home Win' 
                          : p.selection === 'away' 
                            ? 'Away Win' 
                            : p.selection === 'over_2.5' 
                              ? 'Over 2.5 Goals' 
                              : p.selection === 'under_2.5' 
                                ? 'Under 2.5 Goals' 
                                : p.selection === 'yes' 
                                  ? 'BTTS: Yes' 
                                  : p.selection === 'no' 
                                    ? 'BTTS: No' 
                                    : p.selection}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
