'use client';

import React, { useState, useEffect } from 'react';
import { Tournament, Match } from '@pitchos/shared-types';
import { db } from '../../lib/db';
import { createNewTournament, registerTeamInTournament, generateTournamentBrackets } from './tournament-store';

export default function TournamentView() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [entryFee, setEntryFee] = useState('50');
  const [maxParticipants, setMaxParticipants] = useState('4');
  const [isRealMoney, setIsRealMoney] = useState(false);
  const [registerTeamName, setRegisterTeamName] = useState('');

  // Loaded matches for bracket visualization
  const [bracketMatches, setBracketMatches] = useState<Record<string, Match>>({});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refreshData = React.useCallback(async () => {
    try {
      const allTournaments = await db.tournaments.toArray();
      setTournaments(allTournaments);

      if (activeTournament) {
        const freshActive = allTournaments.find(t => t.id === activeTournament.id);
        if (freshActive) {
          setActiveTournament(freshActive);
          
          // Load matches for the active tournament fixtures
          const matchesMap: Record<string, Match> = {};
          for (const fixture of freshActive.fixtures) {
            const m = await db.matches.get(fixture.matchId);
            if (m) matchesMap[fixture.matchId] = m;
          }
          setBracketMatches(matchesMap);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeTournament]);

  useEffect(() => {
    Promise.resolve().then(() => refreshData());
    const interval = setInterval(refreshData, 1500);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError('');
    setSuccess('');
    try {
      const clubs = await db.clubs.toArray();
      if (clubs.length === 0) {
        setError('Create a club first');
        return;
      }
      const t = await createNewTournament(
        clubs[0].id,
        name,
        'knockout',
        parseInt(entryFee, 10),
        parseInt(maxParticipants, 10),
        isRealMoney
      );
      setSuccess(`Tournament "${t.name}" created!`);
      setName('');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create tournament');
    }
  };

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTournament || !registerTeamName.trim()) return;

    setError('');
    setSuccess('');
    try {
      await registerTeamInTournament(activeTournament.id, registerTeamName);
      setSuccess(`Team "${registerTeamName}" registered! Registration fee paid.`);
      setRegisterTeamName('');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register team');
    }
  };

  const handleGenerateBrackets = async () => {
    if (!activeTournament) return;
    setError('');
    try {
      await generateTournamentBrackets(activeTournament.id);
      setSuccess('Brackets generated! Tournament is ACTIVE.');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate brackets');
    }
  };

  // Organize fixtures by round
  const round1Fixtures = activeTournament?.fixtures.filter(f => f.round === 1) || [];
  const round2Fixtures = activeTournament?.fixtures.filter(f => f.round === 2) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Tournament List & Creation Panel */}
      <div className="lg:col-span-1 space-y-6">
        {/* Create Tournament */}
        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <h3 className="font-display text-xl font-bold text-text-primary mb-4">Initialize Tournament</h3>
          <form onSubmit={handleCreateTournament} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Tournament Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Summer Cup 2026"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-green"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Entry Fee</label>
                <input
                  type="number"
                  required
                  value={entryFee}
                  onChange={e => setEntryFee(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Max Teams</label>
                <select
                  value={maxParticipants}
                  onChange={e => setMaxParticipants(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                >
                  <option value="2">2 Teams</option>
                  <option value="4">4 Teams</option>
                  <option value="8">8 Teams</option>
                </select>
              </div>
            </div>

            {/* Compliance real-money warning */}
            <div className="flex items-center gap-2 p-1">
              <input
                type="checkbox"
                id="realMoneyToggle"
                checked={isRealMoney}
                onChange={e => setIsRealMoney(e.target.checked)}
                className="w-4 h-4 accent-primary-green rounded cursor-pointer"
              />
              <label htmlFor="realMoneyToggle" className="text-xs text-text-secondary cursor-pointer">
                Enable Real-Money USDT Escrow
              </label>
            </div>

            {isRealMoney && (
              <div className="bg-pitch-gold bg-opacity-10 border border-pitch-gold border-opacity-20 text-[10px] text-pitch-gold px-3 py-2 rounded-lg leading-relaxed">
                <strong>[ADR-007 Compliance Disclaimer]:</strong> Real-money entry fees require self-custodial escrow signing. Verify regional crypto compliance policy prior to deployment.
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary-green hover:bg-primary-green-hover text-white font-medium py-2 rounded-xl transition duration-200"
            >
              Launch Tournament
            </button>
          </form>
        </div>

        {/* Tournaments List */}
        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <h3 className="font-display text-xl font-bold text-text-primary mb-4">Tournaments</h3>
          {tournaments.length === 0 ? (
            <div className="text-center py-6 bg-bg-dark border border-border-dark rounded-xl">
              <span className="text-xs text-text-secondary">No tournaments initialized yet.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {tournaments.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTournament(t);
                    setBracketMatches({});
                  }}
                  className={`w-full text-left bg-bg-dark hover:bg-card-hover border px-4 py-3.5 rounded-xl transition flex items-center justify-between group ${
                    activeTournament?.id === t.id ? 'border-primary-green' : 'border-border-dark'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block text-text-primary">{t.name}</span>
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold block mt-0.5">
                      Fee: {t.entryFee} {t.isRealMoney ? 'USDT' : 'Points'}
                    </span>
                  </div>
                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                    t.status === 'active'
                      ? 'bg-primary-green bg-opacity-10 text-primary-green border-primary-green border-opacity-20 animate-pulse'
                      : t.status === 'completed'
                        ? 'bg-pitch-gold bg-opacity-10 text-pitch-gold border-pitch-gold border-opacity-20'
                        : 'bg-border-dark text-text-secondary border-border-dark'
                  }`}>
                    {t.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bracket / Registration Workspace */}
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

        {!activeTournament ? (
          <div className="bg-card-dark border border-border-dark rounded-2xl p-12 text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-border-dark flex items-center justify-center mx-auto mb-4 text-text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-text-primary">Tournament brackets</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">
              Select an initialized tournament from the list side-panel to manage registrations and view knockout matches.
            </p>
          </div>
        ) : (
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-dark pb-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-text-primary">{activeTournament.name}</h3>
                <span className="text-xs text-text-secondary">
                  Format: <span className="text-primary-green uppercase font-semibold">{activeTournament.format} Knockout</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-secondary block font-bold uppercase tracking-wider">Target Pool</span>
                <span className="text-base font-bold text-pitch-gold">
                  {activeTournament.teams.length * activeTournament.entryFee} {activeTournament.isRealMoney ? '₮' : 'PTS'}
                </span>
              </div>
            </div>

            {/* Registration Workspace */}
            {activeTournament.status === 'registration' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-bg-dark border border-border-dark rounded-xl p-5 space-y-4">
                  <h4 className="font-display text-md font-bold text-text-primary">Register Team</h4>
                  <form onSubmit={handleRegisterTeam} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Enter Team Name"
                      value={registerTeamName}
                      onChange={e => setRegisterTeamName(e.target.value)}
                      className="flex-grow bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                    />
                    <button
                      type="submit"
                      className="bg-primary-green hover:bg-primary-green-hover text-white text-xs font-semibold py-2 px-5 rounded-xl transition"
                    >
                      Pay & Register
                    </button>
                  </form>
                  <p className="text-[10px] text-text-secondary">
                    * Registering requires paying the entry fee of {activeTournament.entryFee} {activeTournament.isRealMoney ? 'USDT' : 'Points'} directly from your local wallet state.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">
                      Registered Teams ({activeTournament.teams.length} / {activeTournament.maxParticipants})
                    </h4>
                    {activeTournament.teams.length >= 2 && (
                      <button
                        onClick={handleGenerateBrackets}
                        className="bg-pitch-gold text-black text-xs font-bold py-1.5 px-4 rounded-lg transition hover:bg-opacity-80"
                      >
                        Generate Bracket & Start
                      </button>
                    )}
                  </div>

                  {activeTournament.teams.length === 0 ? (
                    <div className="text-center py-4 bg-bg-dark border border-border-dark rounded-xl">
                      <span className="text-xs text-text-secondary">No teams registered yet.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {activeTournament.teams.map((t, idx) => (
                        <div key={idx} className="bg-bg-dark border border-border-dark p-3 rounded-xl flex items-center justify-between text-xs">
                          <span className="font-semibold text-text-primary">{t}</span>
                          <span className="text-primary-green text-[9px] uppercase font-bold bg-primary-green bg-opacity-10 border border-primary-green border-opacity-20 px-2 py-0.5 rounded">
                            Paid
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Visual Knockout Bracket Tree (Only if active or completed) */}
            {activeTournament.status !== 'registration' && (
              <div className="space-y-6 animate-fadeIn">
                <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">Tournament Bracket</h4>
                
                {/* Visual rendering of single knockout bracket */}
                <div className="bg-bg-dark border border-border-dark rounded-xl p-6 overflow-x-auto flex flex-col md:flex-row items-center justify-around gap-8 min-h-[300px]">
                  
                  {/* ROUND 1: Semi-Finals */}
                  <div className="flex flex-col gap-8 w-64">
                    <span className="text-[10px] text-text-secondary font-bold uppercase text-center block tracking-wider">Round 1 — Semi-Finals</span>
                    
                    {round1Fixtures.map(fixture => {
                      const match = bracketMatches[fixture.matchId];
                      return (
                        <div key={fixture.id} className="bg-card-dark border border-border-dark rounded-xl p-3.5 space-y-2.5 relative shadow-md">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-text-primary truncate max-w-[120px]">
                              {match ? match.homeTeam : 'TBD'}
                            </span>
                            <span className="font-bold text-primary-green font-mono">
                              {match?.status === 'completed' || match?.status === 'live' ? match.score?.home : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs border-t border-border-dark pt-2.5">
                            <span className="font-semibold text-text-primary truncate max-w-[120px]">
                              {match ? match.awayTeam : 'TBD'}
                            </span>
                            <span className="font-bold text-primary-green font-mono">
                              {match?.status === 'completed' || match?.status === 'live' ? match.score?.away : '-'}
                            </span>
                          </div>
                          
                          {/* Live Indicator */}
                          {match?.status === 'live' && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pitch-red opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-pitch-red"></span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bracket Connectors */}
                  <div className="hidden md:flex flex-col justify-center text-text-secondary text-sm font-bold">
                    &rarr;
                  </div>

                  {/* ROUND 2: Grand Final */}
                  <div className="flex flex-col gap-8 w-64 justify-center">
                    <span className="text-[10px] text-text-secondary font-bold uppercase text-center block tracking-wider">Round 2 — Grand Final</span>
                    
                    {round2Fixtures.length === 0 ? (
                      <div className="bg-bg-dark border border-border-dark border-dashed rounded-xl p-8 text-center text-xs text-text-secondary">
                        Awaiting Semi-Final Winners
                      </div>
                    ) : (
                      round2Fixtures.map(fixture => {
                        const match = bracketMatches[fixture.matchId];
                        return (
                          <div key={fixture.id} className="bg-card-dark border border-pitch-gold rounded-xl p-3.5 space-y-2.5 relative shadow-md">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-text-primary truncate max-w-[120px]">
                                {match ? match.homeTeam : 'TBD'}
                              </span>
                              <span className="font-bold text-primary-green font-mono">
                                {match?.status === 'completed' || match?.status === 'live' ? match.score?.home : '-'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-t border-border-dark pt-2.5">
                              <span className="font-semibold text-text-primary truncate max-w-[120px]">
                                {match ? match.awayTeam : 'TBD'}
                              </span>
                              <span className="font-bold text-primary-green font-mono">
                                {match?.status === 'completed' || match?.status === 'live' ? match.score?.away : '-'}
                              </span>
                            </div>

                            {match?.status === 'completed' && (
                              <div className="text-[10px] text-pitch-gold font-bold uppercase text-center pt-2">
                                🏆 Champion:{' '}
                                {match.score!.home > match.score!.away
                                  ? match.homeTeam
                                  : match.awayTeam}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Fixture List link helpers */}
                <div className="space-y-3">
                  <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">Fixture Admin List</h4>
                  <div className="space-y-2">
                    {activeTournament.fixtures.map((f, idx) => {
                      const m = bracketMatches[f.matchId];
                      return (
                        <div key={idx} className="bg-bg-dark border border-border-dark rounded-xl px-4 py-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-semibold text-primary-green uppercase tracking-wider mr-2">
                              {f.stageName} (R{f.round})
                            </span>
                            <span className="font-bold text-text-primary">
                              {m ? `${m.homeTeam} vs ${m.awayTeam}` : 'Scheduling...'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold ${
                              m?.status === 'live' 
                                ? 'bg-pitch-red text-white' 
                                : m?.status === 'completed'
                                  ? 'bg-primary-green bg-opacity-10 text-primary-green'
                                  : 'bg-border-dark text-text-secondary'
                            }`}>
                              {m ? m.status : 'Loading'}
                            </span>
                            
                            {m && m.status !== 'completed' && (
                              <span className="text-[10px] text-text-secondary italic">
                                Log in Match Center tab to play
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
