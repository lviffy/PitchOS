'use client';

import React, { useState } from 'react';
import WalletSetup from '../features/wallet/WalletSetup';
import ClubView from '../features/club/ClubView';
import MatchCenter from '../features/match/MatchCenter';
import TournamentView from '../features/tournament/TournamentView';
import PredictionView from '../features/prediction/PredictionView';
import AICoachPanel from '../features/ai/AICoachPanel';
import AnalyticsDashboard from '../features/club/AnalyticsDashboard';
import AdminDashboard from '../features/admin/AdminDashboard';
import { WalletState } from '../features/wallet/wallet-store';

type DashboardTab = 'club' | 'match' | 'tournament' | 'prediction' | 'ai' | 'analytics' | 'admin';

export default function Home() {
  const [wallet, setWallet] = useState<WalletState | null>(() => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('pitchos_wallet');
      return data ? JSON.parse(data) : null;
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<DashboardTab>('club');

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary flex flex-col">
      {/* Premium Header */}
      <header className="border-b border-border-dark bg-card-dark bg-opacity-70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-green to-emerald-400 flex items-center justify-center text-black font-extrabold font-display text-xl shadow-lg shadow-primary-green/20">
              P
            </div>
            <div>
              <span className="font-display font-black text-2xl tracking-tight bg-gradient-to-r from-white to-text-secondary bg-clip-text text-transparent">
                Pitch<span className="text-primary-green">OS</span>
              </span>
              <span className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                Decentralized Football OS
              </span>
            </div>
          </div>

          {wallet && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <span className="text-[10px] text-text-secondary block font-semibold uppercase tracking-wider">Active Wallet</span>
                <span className="text-xs text-primary-green font-mono">
                  {wallet.did.slice(0, 15)}...{wallet.did.slice(-8)}
                </span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('pitchos_wallet');
                  setWallet(null);
                  window.location.reload();
                }}
                className="text-xs bg-transparent border border-border-dark hover:bg-border-dark px-3 py-1.5 rounded-lg text-text-primary transition"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {!wallet ? (
          <div className="py-12">
            <WalletSetup onWalletLoaded={(w) => setWallet(w)} />
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Quick Wallet Stats Top bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-card-dark border border-border-dark rounded-2xl p-4 sm:p-6 shadow-lg">
              <div>
                <h2 className="font-display text-lg font-bold text-text-primary">Welcome, Coach</h2>
                <p className="text-xs text-text-secondary mt-0.5">Manage your club roster and sync peer logs offline.</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-bg-dark border border-border-dark px-4 py-2.5 rounded-xl flex flex-col items-center min-w-[100px]">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">USDT Wallet</span>
                  <span className="text-base font-bold text-text-primary mt-0.5">{wallet.balance} ₮</span>
                </div>
                <div className="bg-bg-dark border border-border-dark px-4 py-2.5 rounded-xl flex flex-col items-center min-w-[100px]">
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Loyalty</span>
                  <span className="text-base font-bold text-pitch-gold mt-0.5">{wallet.points} PTS</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-border-dark flex overflow-x-auto gap-4 scrollbar-none">
              {(
                [
                  { id: 'club', label: 'Club Management' },
                  { id: 'match', label: 'Match Center' },
                  { id: 'tournament', label: 'Tournaments' },
                  { id: 'prediction', label: 'Prediction Circles' },
                  { id: 'ai', label: 'QVAC AI Coach' },
                  { id: 'analytics', label: 'Analytics & Reports' },
                  { id: 'admin', label: 'Admin Dashboard' }
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-sm font-semibold pb-3 border-b-2 transition whitespace-nowrap px-1 ${
                    activeTab === tab.id
                      ? 'border-primary-green text-primary-green'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Workspace panels */}
            <div className="space-y-6">
              {activeTab === 'club' && <ClubView did={wallet.did} />}
              {activeTab === 'match' && <MatchCenter />}
              {activeTab === 'tournament' && <TournamentView />}
              {activeTab === 'prediction' && <PredictionView />}
              {activeTab === 'ai' && <AICoachPanel />}
              {activeTab === 'analytics' && <AnalyticsDashboard />}
              {activeTab === 'admin' && <AdminDashboard />}
            </div>
          </div>
        )}
      </main>

      {/* Premium Footer */}
      <footer className="border-t border-border-dark bg-bg-dark py-6 text-center text-xs text-text-secondary">
        <p>&copy; 2026 PitchOS. Built for Tether Developers Cup 2026. Offline & Sovereign.</p>
      </footer>
    </div>
  );
}
