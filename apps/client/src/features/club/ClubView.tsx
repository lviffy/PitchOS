'use client';

import React, { useState, useEffect } from 'react';
import { Club, RosterEntry } from '@pitchos/shared-types';
import { db } from '../../lib/db';
import { 
  initClubSync, 
  createNewClub, 
  addRosterPlayer, 
  recordAttendance,
  getStoredAttendance
} from './club-store';

interface ClubViewProps {
  did: string;
}

export default function ClubView({ did }: ClubViewProps) {
  const [topic, setTopic] = useState('');
  const [activeTopic, setActiveTopic] = useState('');
  const [connected, setConnected] = useState(false);

  const [club, setClub] = useState<Club | null>(null);
  const [players, setPlayers] = useState<RosterEntry[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string[]>>({});

  // Form states
  const [clubName, setClubName] = useState('');
  const [clubLocation, setClubLocation] = useState('');
  const [clubAgeCategory, setClubAgeCategory] = useState('');

  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [playerJersey, setPlayerJersey] = useState('');
  const [guardianDid, setGuardianDid] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dirtyAttendees, setDirtyAttendees] = useState<Record<string, boolean> | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch local DB data
  const refreshData = async () => {
    try {
      const allClubs = await db.clubs.toArray();
      if (allClubs.length > 0) {
        setClub(allClubs[0]); // Just pick the first club for MVP
        const allPlayers = await db.roster.toArray();
        setPlayers(allPlayers);
        setAttendance(getStoredAttendance());
      } else {
        setClub(null);
        setPlayers([]);
      }
    } catch (err) {
      console.error('Failed to load DB data', err);
    }
  };

  useEffect(() => {
    let active = true;
    db.clubs.toArray().then(allClubs => {
      if (!active) return;
      if (allClubs.length > 0) {
        setClub(allClubs[0]);
        db.roster.toArray().then(allPlayers => {
          if (!active) return;
          setPlayers(allPlayers);
          setAttendance(getStoredAttendance());
        });
      } else {
        setClub(null);
        setPlayers([]);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Connect to P2P sync topic channel
  const handleConnectSync = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setError('');
    setActiveTopic(topic);
    
    const cleanup = initClubSync(
      did, 
      topic, 
      () => {
        // Callback on new block event sync
        refreshData();
      }, 
      (isConnected) => {
        setConnected(isConnected);
      }
    );

    return () => cleanup();
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) {
      setError('Club name required');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const nc = await createNewClub(clubName, clubLocation, clubAgeCategory);
      setSuccess(`Club "${nc.name}" created successfully!`);
      setClubName('');
      setClubLocation('');
      setClubAgeCategory('');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create club');
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !playerPosition.trim()) {
      setError('Player name and position required');
      return;
    }
    if (!club) {
      setError('Create a club first');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const jersey = playerJersey ? parseInt(playerJersey, 10) : undefined;
      await addRosterPlayer(
        club.id,
        playerName,
        playerPosition,
        jersey,
        guardianDid || undefined,
        emergencyName || undefined,
        emergencyPhone || undefined
      );
      setSuccess(`Player "${playerName}" added to roster!`);
      setPlayerName('');
      setPlayerPosition('');
      setPlayerJersey('');
      setGuardianDid('');
      setEmergencyName('');
      setEmergencyPhone('');
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
    }
  };

  const handleToggleAttendee = (playerId: string) => {
    const currentAttendees = attendance[attendanceDate] || [];
    setDirtyAttendees(prev => {
      const current = prev ?? players.reduce((acc, p) => {
        acc[p.playerId] = currentAttendees.includes(p.playerId);
        return acc;
      }, {} as Record<string, boolean>);
      return {
        ...current,
        [playerId]: !current[playerId]
      };
    });
  };

  const handleSaveAttendance = async () => {
    if (players.length === 0) return;
    setError('');
    setSuccess('');
    try {
      const activeIds = players
        .filter(p => activeAttendees[p.playerId])
        .map(p => p.playerId);

      await recordAttendance(attendanceDate, activeIds);
      setSuccess(`Attendance recorded for ${attendanceDate}`);
      setDirtyAttendees(null);
      refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance');
    }
  };

  const currentAttendees = attendance[attendanceDate] || [];
  const activeAttendees = dirtyAttendees ?? players.reduce((acc, p) => {
    acc[p.playerId] = currentAttendees.includes(p.playerId);
    return acc;
  }, {} as Record<string, boolean>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* LEFT COLUMN: P2P SYNC STATUS & CLUB DETAILS */}
      <div className="space-y-6 lg:col-span-1">
        {/* P2P Connectivity Panel */}
        <div className="bg-card-dark border border-border-dark rounded-xl p-6">
          <h3 className="font-sans text-xl font-bold text-text-primary mb-4">P2P Network Center</h3>
          
          <form onSubmit={handleConnectSync} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Swarm Topic / Invite Code
              </label>
              <input
                type="text"
                placeholder="e.g. london-wolves-2026"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={!!activeTopic}
                className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-green"
              />
            </div>
            
            {!activeTopic ? (
              <button
                type="submit"
                className="w-full bg-primary-green hover:bg-primary-green-hover text-white font-medium py-2 px-4 rounded-xl transition duration-200"
              >
                Join Sync Swarm
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-bg-dark border border-border-dark px-3 py-2 rounded-xl text-sm">
                  <span className="text-text-secondary">Status:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-primary-green animate-pulse' : 'bg-pitch-red'}`}></span>
                    <span className={connected ? 'text-primary-green font-medium' : 'text-pitch-red font-medium'}>
                      {connected ? 'Sync Connected' : 'Connecting...'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-text-secondary">
                  Connected to swarm topic: <span className="text-primary-green font-mono">{activeTopic}</span>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full bg-transparent border border-border-dark hover:bg-border-dark text-text-primary font-medium py-2 px-4 rounded-xl transition duration-200"
                >
                  Disconnect Swarm
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Club Profile Card */}
        {club && (
          <div className="bg-card-dark border border-border-dark rounded-xl p-6">
            <h3 className="font-sans text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary-green">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-5.75c-.621 0-1.125.504-1.125 1.125v3.375m9 0ZM9 10.5h.008v.008H9V10.5Zm.008 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 10.5h.008v.008H12V10.5Zm.008 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm3-2.25h.008v.008H15V8.25Zm.008 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              Club Profile
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-text-secondary block">Club Name</span>
                <span className="text-text-primary text-lg font-bold">{club.name}</span>
              </div>
              {club.location && (
                <div>
                  <span className="text-text-secondary block">Location</span>
                  <span className="text-text-primary">{club.location}</span>
                </div>
              )}
              {club.ageCategory && (
                <div>
                  <span className="text-text-secondary block">Age Group</span>
                  <span className="text-primary-green bg-primary-green/10 border border-primary-green/20 px-2.5 py-0.5 rounded-full inline-block mt-0.5 text-xs font-semibold">
                    {club.ageCategory}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT TWO COLUMNS: DETAILS, ROSTER MANAGEMENT, & ATTENDANCE */}
      <div className="space-y-6 lg:col-span-2">
        {/* Error / Success Notifications */}
        {error && (
          <div className="bg-pitch-red bg-opacity-10 border border-pitch-red border-opacity-20 text-pitch-red text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-primary-green bg-opacity-10 border border-primary-green border-opacity-20 text-primary-green text-sm px-4 py-3 rounded-xl">
            {success}
          </div>
        )}

        {/* If no club exists, show create club form */}
        {!club ? (
          <div className="bg-card-dark border border-border-dark rounded-xl p-8">
            <h3 className="font-sans text-2xl font-bold text-text-primary mb-2">Create Football Club</h3>
            <p className="text-sm text-text-secondary mb-6">Initialize a new club workspace inside this sync channel.</p>
            
            <form onSubmit={handleCreateClub} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Club Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. London Wolves FC"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. West London"
                    value={clubLocation}
                    onChange={(e) => setClubLocation(e.target.value)}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Age Category</label>
                <input
                  type="text"
                  placeholder="e.g. Under 17, Seniors"
                  value={clubAgeCategory}
                  onChange={(e) => setClubAgeCategory(e.target.value)}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                />
              </div>
              <button
                type="submit"
                className="bg-primary-green hover:bg-primary-green-hover text-white font-semibold py-2.5 px-6 rounded-xl transition duration-200"
              >
                Create Club
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Roster & Add Player Section */}
            <div className="bg-card-dark border border-border-dark rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-sans text-2xl font-bold text-text-primary">Team Roster ({players.length})</h3>
              </div>

              {/* Roster Table */}
              {players.length === 0 ? (
                <div className="text-center py-8 bg-bg-dark border border-border-dark rounded-xl mb-6">
                  <p className="text-sm text-text-secondary">No players in this roster yet. Add your first player below.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-bg-dark border border-border-dark rounded-xl mb-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-dark text-xs uppercase tracking-wider text-text-secondary">
                        <th className="px-4 py-3">Jersey</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Position</th>
                        <th className="px-4 py-3">Guardian</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-text-primary divide-y divide-border-dark">
                      {players.map((player) => (
                        <tr key={player.id} className="hover:bg-card-hover transition">
                          <td className="px-4 py-3.5 font-bold text-primary-green">#{player.jerseyNumber || '-'}</td>
                          <td className="px-4 py-3.5 font-semibold">{player.name}</td>
                          <td className="px-4 py-3.5 text-text-secondary">{player.position}</td>
                          <td className="px-4 py-3.5 text-xs text-text-secondary font-mono truncate max-w-[120px]">
                            {player.guardianDid || 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add Player Form */}
              <div className="border-t border-border-dark pt-6">
                <h4 className="font-sans text-lg font-bold text-text-primary mb-4">Add Player to Roster</h4>
                <form onSubmit={handleAddPlayer} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Player Name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Position (e.g. GK, Midfielder)"
                        value={playerPosition}
                        onChange={(e) => setPlayerPosition(e.target.value)}
                        className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Jersey Number"
                        value={playerJersey}
                        onChange={(e) => setPlayerJersey(e.target.value)}
                        className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        placeholder="Guardian DID (For minors)"
                        value={guardianDid}
                        onChange={(e) => setGuardianDid(e.target.value)}
                        className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green font-mono"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Emergency Contact Name"
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                        className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                      />
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Emergency Contact Phone"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary-green hover:bg-primary-green-hover text-white font-medium py-2 px-5 rounded-xl transition duration-200"
                  >
                    Add Player
                  </button>
                </form>
              </div>
            </div>

            {/* Attendance Session Section */}
            <div className="bg-card-dark border border-border-dark rounded-xl p-6">
              <h3 className="font-sans text-2xl font-bold text-text-primary mb-2">Attendance Sheet</h3>
              <p className="text-sm text-text-secondary mb-6">Log and verify session attendance offline.</p>

              <div className="flex gap-4 items-center mb-6">
                <div>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => {
                      setAttendanceDate(e.target.value);
                      setDirtyAttendees(null);
                    }}
                    className="bg-bg-dark border border-border-dark rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-green font-mono"
                  />
                </div>
              </div>

              {players.length === 0 ? (
                <div className="text-center py-4 bg-bg-dark border border-border-dark rounded-xl">
                  <p className="text-sm text-text-secondary">Roster empty. Attendance unavailable.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-bg-dark border border-border-dark rounded-xl p-4 space-y-2.5 max-h-60 overflow-y-auto">
                    {players.map((player) => (
                      <label key={player.id} className="flex items-center justify-between p-2 hover:bg-card-hover rounded-lg cursor-pointer">
                        <span className="font-semibold text-sm">{player.name} ({player.position})</span>
                        <input
                          type="checkbox"
                          checked={!!activeAttendees[player.playerId]}
                          onChange={() => handleToggleAttendee(player.playerId)}
                          className="w-5 h-5 accent-primary-green cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveAttendance}
                    className="bg-primary-green hover:bg-primary-green-hover text-white font-medium py-2.5 px-6 rounded-xl transition duration-200"
                  >
                    Save Attendance Log
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
