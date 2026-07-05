'use client';

import React, { useState, useEffect } from 'react';
import { Match, MatchEventType, RosterEntry } from '@pitchos/shared-types';
import { db } from '../../lib/db';
import { createNewMatch, startMatch, logMatchEvent, endMatch } from './match-store';
import { generateMatchPostAnalysis, MatchAnalysis } from '../ai/qvac-service';

export default function MatchCenter() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<RosterEntry[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  // Form states
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  
  // Log event state
  const [eventMinute, setEventMinute] = useState<number>(1);
  const [eventPlayer, setEventPlayer] = useState('');
  const [subPlayerIn, setSubPlayerIn] = useState('');
  const [eventDetails, setEventDetails] = useState('home'); // 'home' or 'away' for goals

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<MatchAnalysis | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refreshData = React.useCallback(async () => {
    try {
      const allMatches = await db.matches.toArray();
      setMatches(allMatches);
      
      const allPlayers = await db.roster.toArray();
      setPlayers(allPlayers);

      if (activeMatch) {
        const freshActive = allMatches.find(m => m.id === activeMatch.id);
        if (freshActive) setActiveMatch(freshActive);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeMatch]);

  useEffect(() => {
    Promise.resolve().then(() => refreshData());
    // Setup interval to poll local DB for live sync updates
    const interval = setInterval(refreshData, 1500);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setError('Home and Away teams are required');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const clubList = await db.clubs.toArray();
      if (clubList.length === 0) {
        setError('Create a club first');
        return;
      }
      await createNewMatch(clubList[0].id, homeTeam, awayTeam);
      setSuccess(`Match scheduled: ${homeTeam} vs ${awayTeam}`);
      setHomeTeam('');
      setAwayTeam('');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create match');
    }
  };

  const handleStartMatch = async (matchId: string) => {
    setError('');
    try {
      await startMatch(matchId);
      setSuccess('Match is now LIVE!');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start match');
    }
  };

  const handleLogEvent = async (e: React.FormEvent, eventType: MatchEventType) => {
    e.preventDefault();
    if (!activeMatch) return;
    setError('');
    try {
      let playerId: string | undefined = eventPlayer || undefined;
      let playerOutId: string | undefined = undefined;
      let details: string | undefined = undefined;

      if (eventType === 'goal') {
        details = eventDetails; // 'home' or 'away'
      } else if (eventType === 'substitution') {
        playerOutId = eventPlayer;
        playerId = subPlayerIn;
        if (!playerOutId || !playerId) {
          setError('Select both player out and player in');
          return;
        }
      }

      await logMatchEvent(
        activeMatch.id,
        eventType,
        eventMinute,
        playerId,
        playerOutId,
        details
      );
      
      setSuccess(`Logged ${eventType} at min ${eventMinute}`);
      setEventPlayer('');
      setSubPlayerIn('');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log event');
    }
  };

  const handleEndMatch = async (matchId: string) => {
    if (!activeMatch) return;
    setError('');
    setAiAnalyzing(true);
    try {
      // Simulate QVAC analysis
      const analysis = await generateMatchPostAnalysis(activeMatch, players);
      
      const finalResult = {
        scoreHome: activeMatch.score?.home ?? 0,
        scoreAway: activeMatch.score?.away ?? 0,
        playerRatings: analysis.playerRatings
      };

      await endMatch(matchId, finalResult);
      setAiReport(analysis);
      setSuccess('Match ended and analyzed by QVAC AI!');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to end match');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const getPlayerName = (id?: string) => {
    if (!id) return 'Unknown Player';
    return players.find(p => p.playerId === id)?.name || id;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List of Matches & Create Match */}
      <div className="lg:col-span-1 space-y-6">
        {/* Create Match Form */}
        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <h3 className="font-display text-xl font-bold text-text-primary mb-4">Schedule Match</h3>
          <form onSubmit={handleCreateMatch} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Home Team</label>
              <input
                type="text"
                required
                placeholder="e.g. London Wolves (You)"
                value={homeTeam}
                onChange={e => setHomeTeam(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Away Team</label>
              <input
                type="text"
                required
                placeholder="e.g. Manchester Red FC"
                value={awayTeam}
                onChange={e => setAwayTeam(e.target.value)}
                className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary-green hover:bg-primary-green-hover text-white font-medium py-2 rounded-xl transition duration-200"
            >
              Schedule Match
            </button>
          </form>
        </div>

        {/* Matches List */}
        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <h3 className="font-display text-xl font-bold text-text-primary mb-4">Matches Roster</h3>
          {matches.length === 0 ? (
            <div className="text-center py-6 bg-bg-dark border border-border-dark rounded-xl">
              <span className="text-xs text-text-secondary">No matches scheduled yet.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {matches.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveMatch(m);
                    setAiReport(null);
                  }}
                  className={`w-full text-left bg-bg-dark hover:bg-card-hover border px-4 py-3.5 rounded-xl transition flex items-center justify-between group ${
                    activeMatch?.id === m.id ? 'border-primary-green' : 'border-border-dark'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      {m.homeTeam} vs {m.awayTeam}
                    </div>
                    <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                      Score: {m.score?.home ?? 0} - {m.score?.away ?? 0}
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    m.status === 'live' 
                      ? 'bg-pitch-red bg-opacity-10 text-pitch-red border border-pitch-red border-opacity-20 animate-pulse' 
                      : m.status === 'completed'
                        ? 'bg-primary-green bg-opacity-10 text-primary-green border border-primary-green border-opacity-20'
                        : 'bg-border-dark text-text-secondary'
                  }`}>
                    {m.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Match Console View */}
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

        {!activeMatch ? (
          <div className="bg-card-dark border border-border-dark rounded-2xl p-12 text-center shadow-xl">
            <div className="w-16 h-16 rounded-full bg-border-dark flex items-center justify-center mx-auto mb-4 text-text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-5.75c-.621 0-1.125.504-1.125 1.125v3.375m9 0ZM9 10.5h.008v.008H9V10.5Zm.008 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 10.5h.008v.008H12V10.5Zm.008 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm3-2.25h.008v.008H15V8.25Zm.008 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-text-primary">Match Console</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">
              Select a scheduled or live match from the roster panel to enter real-time event tracking and statistics analysis.
            </p>
          </div>
        ) : (
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl space-y-6">
            {/* Header: Scoreboard */}
            <div className="bg-bg-dark border border-border-dark rounded-xl p-6 text-center space-y-3">
              <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                {activeMatch.status === 'live' && <span className="w-2.5 h-2.5 bg-pitch-red rounded-full inline-block animate-ping mr-1"></span>}
                {activeMatch.status} match
              </div>
              <div className="flex items-center justify-around">
                <div className="text-lg font-bold text-text-primary w-2/5 truncate">{activeMatch.homeTeam}</div>
                <div className="text-3xl font-black text-primary-green w-1/5 font-mono">
                  {activeMatch.score?.home ?? 0} - {activeMatch.score?.away ?? 0}
                </div>
                <div className="text-lg font-bold text-text-primary w-2/5 truncate">{activeMatch.awayTeam}</div>
              </div>
              
              {activeMatch.status === 'scheduled' && (
                <button
                  onClick={() => handleStartMatch(activeMatch.id)}
                  className="bg-primary-green hover:bg-primary-green-hover text-white text-xs font-semibold py-2 px-6 rounded-xl transition mt-2"
                >
                  Start Match Live
                </button>
              )}

              {activeMatch.status === 'live' && (
                <button
                  onClick={() => handleEndMatch(activeMatch.id)}
                  disabled={aiAnalyzing}
                  className="bg-pitch-red hover:bg-opacity-80 text-white text-xs font-semibold py-2 px-6 rounded-xl transition mt-2 disabled:opacity-50"
                >
                  {aiAnalyzing ? 'QVAC Analyzing Match...' : 'End Match & Run AI Analytics'}
                </button>
              )}
            </div>

            {/* Event Logging Section (Only if live) */}
            {activeMatch.status === 'live' && (
              <div className="border border-border-dark rounded-xl p-4 bg-bg-dark bg-opacity-30 space-y-4">
                <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">Log Match Event</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] text-text-secondary font-semibold uppercase tracking-wider mb-1">Match Minute</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={eventMinute}
                      onChange={e => setEventMinute(parseInt(e.target.value, 10))}
                      className="w-full bg-bg-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-secondary font-semibold uppercase tracking-wider mb-1">Select Player</label>
                    <select
                      value={eventPlayer}
                      onChange={e => setEventPlayer(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                    >
                      <option value="">-- None --</option>
                      {players.map(p => (
                        <option key={p.id} value={p.playerId}>{p.name} (#{p.jerseyNumber})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-secondary font-semibold uppercase tracking-wider mb-1">Context / In</label>
                    {/* If goal, home vs away. If substitution, player in */}
                    <select
                      value={eventDetails}
                      onChange={e => setEventDetails(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                    >
                      <option value="home">Home Team Scored</option>
                      <option value="away">Away Team Scored</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 justify-end">
                  <button
                    onClick={(e) => handleLogEvent(e, 'goal')}
                    className="bg-primary-green hover:bg-primary-green-hover text-white text-xs font-semibold py-1.5 px-4 rounded-lg transition"
                  >
                    Goal
                  </button>
                  <button
                    onClick={(e) => handleLogEvent(e, 'yellow_card')}
                    className="bg-pitch-gold text-black text-xs font-semibold py-1.5 px-4 rounded-lg transition"
                  >
                    Yellow Card
                  </button>
                  <button
                    onClick={(e) => handleLogEvent(e, 'red_card')}
                    className="bg-pitch-red text-white text-xs font-semibold py-1.5 px-4 rounded-lg transition"
                  >
                    Red Card
                  </button>
                  
                  {/* Substitution Controls */}
                  <div className="flex items-center gap-1.5 border-l border-border-dark pl-2">
                    <select
                      value={subPlayerIn}
                      onChange={e => setSubPlayerIn(e.target.value)}
                      className="bg-bg-dark border border-border-dark rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none"
                    >
                      <option value="">-- Sub Player In --</option>
                      {players.map(p => (
                        <option key={p.id} value={p.playerId}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={(e) => handleLogEvent(e, 'substitution')}
                      className="bg-transparent border border-border-dark text-text-primary hover:bg-border-dark text-xs font-semibold py-1.5 px-4 rounded-lg transition"
                    >
                      Substitution
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QVAC AI Report (If available / compiled) */}
            {(activeMatch.status === 'completed' || aiReport) && (
              <div className="bg-bg-dark border border-border-dark rounded-xl p-5 space-y-4 animate-fadeIn">
                <h4 className="font-display text-md font-bold text-primary-green flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pitch-gold animate-ping"></span>
                  QVAC AI Technical Match Report
                </h4>
                
                {aiReport ? (
                  <div className="space-y-3 text-xs">
                    <div className="bg-card-dark border border-border-dark p-3.5 rounded-lg">
                      <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold mb-1">Post-Match Summary</span>
                      <p className="text-text-primary leading-relaxed">{aiReport.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-card-dark border border-border-dark p-3.5 rounded-lg">
                        <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold mb-2">Tactical Feedback</span>
                        <p className="text-text-primary leading-relaxed">{aiReport.tacticalTip}</p>
                      </div>
                      <div className="bg-card-dark border border-border-dark p-3.5 rounded-lg">
                        <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold mb-1">Match MVP</span>
                        <span className="text-sm font-bold text-pitch-gold">{aiReport.mvp}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold mb-2">Player Performance Ratings</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(aiReport.playerRatings).map(([pId, rating]) => (
                          <div key={pId} className="bg-card-dark border border-border-dark p-2 rounded-lg flex justify-between items-center">
                            <span className="font-semibold text-[11px] truncate max-w-[80px]">{getPlayerName(pId)}</span>
                            <span className="text-primary-green font-bold font-mono">{rating}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-text-secondary">
                    Match results recorded. Local QVAC dashboard report available in match history.
                  </div>
                )}
              </div>
            )}

            {/* Match Event Timeline */}
            <div className="space-y-3">
              <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">Timeline Events ({activeMatch.events.length})</h4>
              
              {activeMatch.events.length === 0 ? (
                <div className="text-center py-4 bg-bg-dark border border-border-dark rounded-xl">
                  <span className="text-xs text-text-secondary">No match events logged.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeMatch.events.map(e => (
                    <div key={e.id} className="bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 flex items-center justify-between text-xs transition hover:bg-card-hover">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary-green font-mono">{e.minute}&apos;</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          e.type === 'goal' 
                            ? 'bg-primary-green bg-opacity-10 text-primary-green' 
                            : e.type === 'substitution'
                              ? 'bg-border-dark text-text-primary'
                              : 'bg-pitch-red bg-opacity-10 text-pitch-red'
                        }`}>
                          {e.type}
                        </span>
                        <span className="text-text-primary font-semibold">
                          {e.type === 'substitution' 
                            ? `Out: ${getPlayerName(e.playerOutId)} / In: ${getPlayerName(e.playerId)}` 
                            : getPlayerName(e.playerId)}
                        </span>
                      </div>
                      {e.details && (
                        <span className="text-[10px] text-text-secondary uppercase font-semibold">
                          ({e.details})
                        </span>
                      )}
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
