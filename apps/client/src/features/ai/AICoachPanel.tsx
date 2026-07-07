'use client';

import React, { useState, useEffect } from 'react';
import { generateAICoachResponse, AIResponse, unloadActiveModel } from './qvac-service';
import { RosterEntry } from '@pitchos/shared-types';
import { db } from '../../lib/db';

export default function AICoachPanel() {
  const [players, setPlayers] = useState<RosterEntry[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ q: string; a: string; timestamp: number }>>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');

  useEffect(() => {
    let active = true;
    db.roster.toArray().then(p => {
      if (active) setPlayers(p);
    });
    return () => {
      active = false;
      unloadActiveModel();
    };
  }, []);

  const handleAsk = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const queryText = customQ || question;
    if (!queryText.trim()) return;

    setLoading(true);
    try {
      const resp: AIResponse = await generateAICoachResponse(queryText, players);
      setHistory(prev => [...prev, { q: queryText, a: resp.answer, timestamp: resp.timestamp }]);
      if (!customQ) setQuestion('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerQuery = (playerName: string) => {
    setSelectedPlayer(playerName);
    handleAsk(undefined, `How is ${playerName}'s performance and technique trending?`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Player select & preset questions */}
      <div className="lg:col-span-1 space-y-6">
        {/* Preset Roster Diagnostic */}
        <div className="bg-card-dark border border-border-dark rounded-xl p-6">
          <h3 className="font-sans text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primary-green animate-pulse"></span>
            Roster Analysis
          </h3>
          <p className="text-xs text-text-secondary mb-4">
            Select any player from your synced team roster to run a local technique analysis.
          </p>

          {players.length === 0 ? (
            <div className="text-center py-4 bg-bg-dark border border-border-dark rounded-xl">
              <span className="text-xs text-text-secondary">Roster is empty. Add players to enable AI analysis.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePlayerQuery(p.name)}
                  className={`w-full text-left bg-bg-dark hover:bg-card-hover border border-border-dark px-3 py-2.5 rounded-xl transition duration-200 text-xs flex items-center justify-between group ${
                    selectedPlayer === p.name ? 'border-primary-green text-primary-green' : 'text-text-primary'
                  }`}
                >
                  <div>
                    <span className="font-semibold block">{p.name}</span>
                    <span className="text-xs text-text-secondary">{p.position}</span>
                  </div>
                  <span className="text-primary-green opacity-0 group-hover:opacity-100 transition text-xs font-semibold">
                    Analyze &rarr;
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preset Tactical Guides */}
        <div className="bg-card-dark border border-border-dark rounded-xl p-6">
          <h3 className="font-sans text-lg font-bold text-text-primary mb-4">Tactical Presets</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleAsk(undefined, 'How to defend a 4-3-3 formation?')}
              className="w-full text-left bg-bg-dark hover:bg-card-hover border border-border-dark px-4 py-3 rounded-xl transition text-xs text-text-secondary hover:text-text-primary"
            >
              Defending against a 4-3-3
            </button>
            <button
              onClick={() => handleAsk(undefined, 'Suggest transition pressing drills')}
              className="w-full text-left bg-bg-dark hover:bg-card-hover border border-border-dark px-4 py-3 rounded-xl transition text-xs text-text-secondary hover:text-text-primary"
            >
              Midfield pressing drills
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Main Chat Window */}
      <div className="lg:col-span-2 bg-card-dark border border-border-dark rounded-xl flex flex-col h-[520px] overflow-hidden">
        {/* Chat Header */}
        <div className="border-b border-border-dark px-6 py-4 bg-bg-dark bg-opacity-40 flex items-center justify-between">
          <div>
            <h3 className="font-sans text-lg font-bold text-text-primary">QVAC AI Assistant</h3>
            <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-green"></span>
              On-Device Mode (100% Offline)
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              className="text-xs text-pitch-red hover:underline font-semibold uppercase tracking-wider"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Chat Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary-green bg-opacity-10 text-primary-green flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">Ask QVAC AI Coach</h4>
                <p className="text-xs text-text-secondary mt-1 max-w-sm">
                  Query player stats, request custom tactical training routines, or get game analysis offline.
                </p>
              </div>
            </div>
          ) : (
            history.map((chat, idx) => (
              <div key={idx} className="space-y-3">
                {/* User Bubble */}
                <div className="flex justify-end">
                  <div className="bg-primary-green bg-opacity-10 border border-primary-green border-opacity-20 text-text-primary px-4 py-3 rounded-xl rounded-tr-none max-w-lg text-sm">
                    {chat.q}
                  </div>
                </div>
                {/* AI Bubble */}
                <div className="flex justify-start">
                  <div className="bg-bg-dark border border-border-dark text-text-primary px-5 py-4 rounded-xl rounded-tl-none max-w-xl text-sm whitespace-pre-wrap leading-relaxed">
                    {chat.a}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-bg-dark border border-border-dark px-5 py-4 rounded-xl rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-primary-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-primary-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs text-text-secondary font-medium">Local QVAC inference running...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Controls */}
        <form onSubmit={handleAsk} className="border-t border-border-dark p-4 bg-bg-dark bg-opacity-20 flex gap-2">
          <input
            type="text"
            placeholder="Ask QVAC AI Coach... (e.g. 'How to defend a 4-3-3?')"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            disabled={loading}
            className="flex-1 bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-primary-green disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-primary-green hover:bg-primary-green-hover text-white px-5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
