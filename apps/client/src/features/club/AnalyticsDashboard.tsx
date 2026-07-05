'use client';

import React, { useState, useEffect } from 'react';
import { RosterEntry } from '@pitchos/shared-types';
import { db } from '../../lib/db';
import { generateWeeklyPlayerReport, WeeklyReport } from '../ai/qvac-service';

export default function AnalyticsDashboard() {
  const [players, setPlayers] = useState<RosterEntry[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<RosterEntry | null>(null);

  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    let active = true;
    db.roster.toArray().then(p => {
      if (active) {
        setPlayers(p);
        if (p.length > 0) setSelectedPlayer(p[0]);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedPlayer) return;
    setLoading(true);
    setAiReport(null);
    try {
      const report = await generateWeeklyPlayerReport(selectedPlayer);
      setAiReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => setAiReport(null));
  }, [selectedPlayer?.id]);

  // Generate deterministic premium stats for the dashboard layout
  const getPlayerStatsValue = (name: string, statName: string) => {
    const seed = (name.length + statName.length) % 5;
    return 70 + seed * 6; // 70 to 94 range
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Roster Select panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <h3 className="font-display text-xl font-bold text-text-primary mb-4">Select Player</h3>
          {players.length === 0 ? (
            <div className="text-center py-6 bg-bg-dark border border-border-dark rounded-xl">
              <span className="text-xs text-text-secondary">No roster players found.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {players.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayer(p)}
                  className={`w-full text-left bg-bg-dark hover:bg-card-hover border px-4 py-3 rounded-xl transition flex items-center justify-between group ${
                    selectedPlayer?.id === p.id ? 'border-primary-green' : 'border-border-dark'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-xs block text-text-primary">{p.name}</span>
                    <span className="text-[10px] text-text-secondary">
                      {p.position} | Jersey #{p.jerseyNumber || '-'}
                    </span>
                  </div>
                  <span className="text-primary-green text-[10px] font-bold opacity-0 group-hover:opacity-100 transition">
                    View &rarr;
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Analytics workspace */}
      <div className="lg:col-span-2 space-y-6">
        {!selectedPlayer ? (
          <div className="bg-card-dark border border-border-dark rounded-2xl p-12 text-center shadow-xl">
            <h3 className="font-display text-xl font-bold text-text-primary">Performance Analytics</h3>
            <p className="text-sm text-text-secondary mt-1">
              Select a player to load tactical analytics and generate progress reports.
            </p>
          </div>
        ) : (
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-dark pb-4">
              <div>
                <h3 className="font-display text-2xl font-bold text-text-primary">{selectedPlayer.name}</h3>
                <span className="text-xs text-text-secondary uppercase tracking-widest font-semibold">
                  Roster Position:{' '}
                  <span className="text-primary-green">{selectedPlayer.position}</span>
                </span>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="bg-primary-green hover:bg-primary-green-hover text-white text-xs font-semibold py-2 px-5 rounded-xl transition disabled:opacity-50"
              >
                {loading ? 'Running AI Engine...' : 'Run QVAC Weekly Report'}
              </button>
            </div>

            {/* Performance Charts */}
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">
                Technical Attributes
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(
                  [
                    { name: 'Passing Accuracy', key: 'passing' },
                    { name: 'Sprint Speed', key: 'speed' },
                    { name: 'Physical Stamina', key: 'stamina' },
                    { name: 'Tactical Discipline', key: 'tactics' }
                  ] as const
                ).map(stat => {
                  const val = getPlayerStatsValue(selectedPlayer.name, stat.key);
                  return (
                    <div key={stat.key} className="bg-bg-dark border border-border-dark p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-text-secondary">{stat.name}</span>
                        <span className="text-primary-green font-mono">{val}%</span>
                      </div>
                      <div className="w-full bg-border-dark rounded-full h-2">
                        <div
                          className="bg-primary-green h-2 rounded-full transition-all duration-500"
                          style={{ width: `${val}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Diagnostics Panel */}
            {loading && (
              <div className="bg-bg-dark border border-border-dark rounded-xl p-6 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-primary-green border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span className="text-xs text-text-secondary block">
                  Processing player data and logs through on-device QVAC engine...
                </span>
              </div>
            )}

            {aiReport && (
              <div className="bg-bg-dark border border-border-dark rounded-xl p-5 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-border-dark pb-3">
                  <h4 className="font-display text-sm font-bold text-primary-green">
                    QVAC Weekly Performance Report
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-secondary uppercase font-semibold">Score:</span>
                    <span className="text-sm font-bold text-pitch-gold font-mono">{aiReport.progressScore}/100</span>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs leading-relaxed text-text-primary">
                  <div className="bg-card-dark border border-border-dark p-3.5 rounded-lg whitespace-pre-wrap">
                    {aiReport.report}
                  </div>

                  <div className="bg-card-dark border border-border-dark p-3.5 rounded-lg space-y-2">
                    <span className="text-[9px] text-text-secondary uppercase font-semibold block">
                      Identified Weaknesses:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-pitch-red">
                      {aiReport.weaknesses.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
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
