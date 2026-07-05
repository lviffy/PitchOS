'use client';

import React, { useState, useEffect } from 'react';
import WalletSetup from '../features/wallet/WalletSetup';
import ClubView from '../features/club/ClubView';
import MatchCenter from '../features/match/MatchCenter';
import TournamentView from '../features/tournament/TournamentView';
import PredictionView from '../features/prediction/PredictionView';
import AICoachPanel from '../features/ai/AICoachPanel';
import AnalyticsDashboard from '../features/club/AnalyticsDashboard';
import AdminDashboard from '../features/admin/AdminDashboard';
import { WalletState } from '../features/wallet/wallet-store';
import {
  UsersThree,
  SoccerBall,
  Trophy,
  Target,
  Brain,
  ChartBar,
  GearSix,
  Key,
  ShieldCheck,
  Globe,
  Lightning,
} from '@phosphor-icons/react';

type DashboardTab = 'club' | 'match' | 'tournament' | 'prediction' | 'ai' | 'analytics' | 'admin';

const TABS: { id: DashboardTab; label: string; Icon: React.ElementType }[] = [
  { id: 'club', label: 'Club', Icon: UsersThree },
  { id: 'match', label: 'Match Center', Icon: SoccerBall },
  { id: 'tournament', label: 'Tournaments', Icon: Trophy },
  { id: 'prediction', label: 'Predictions', Icon: Target },
  { id: 'ai', label: 'QVAC AI', Icon: Brain },
  { id: 'analytics', label: 'Analytics', Icon: ChartBar },
  { id: 'admin', label: 'Admin', Icon: GearSix },
];

export default function Home() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('club');
  const [showTerminalSetup, setShowTerminalSetup] = useState(false);

  useEffect(() => {
    setMounted(true);
    const data = localStorage.getItem('pitchos_wallet');
    if (data) {
      setWallet(JSON.parse(data));
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-bg-dark text-text-primary flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-2.5 h-2.5 bg-primary-green rounded-none animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2.5 h-2.5 bg-primary-green rounded-none animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2.5 h-2.5 bg-primary-green rounded-none animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    );
  }

  // LANDING PAGE (NO WALLET)
  if (!wallet) {
    return (
      <div className="min-h-screen bg-bg-dark text-text-primary flex flex-col font-sans">
        {/* Header */}
        <header className="border-b border-border-dark bg-card-dark sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-green flex items-center justify-center text-black font-extrabold text-base select-none">
                P
              </div>
              <div>
                <span className="font-sans font-black text-lg tracking-tight text-text-primary">
                  Pitch<span className="text-primary-green">OS</span>
                </span>
                <span className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                  Decentralized Football OS
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setShowTerminalSetup(true);
                document.getElementById('terminal-workspace')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs bg-primary-green hover:bg-primary-green-hover text-black font-bold px-4 py-2 border-0 transition cursor-pointer"
            >
              LAUNCH OS
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="border-b border-border-dark py-20 px-6 bg-card-dark/30">
          <div className="max-w-4xl mx-auto text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-dark text-[11px] font-mono uppercase tracking-widest text-primary-green bg-bg-dark">
              <span className="w-2 h-2 bg-primary-green animate-pulse"></span>
              P2P Protocol active
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none uppercase">
              Sovereign Football <br/>
              <span className="text-primary-green">Operations.</span>
            </h1>
            <p className="text-base md:text-lg text-text-secondary leading-relaxed max-w-[65ch]">
              An offline-first, cryptographic operating system built for grassroots clubs. Manage rosters, tournaments, live score logging, and prediction pools without centralized servers or databases.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => {
                  setShowTerminalSetup(true);
                  document.getElementById('terminal-workspace')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-primary-green hover:bg-primary-green-hover text-black font-bold px-6 py-3 text-sm transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-green"
              >
                GENERATE TERMINAL KEYS
              </button>
              <a
                href="#protocol"
                className="bg-transparent hover:bg-card-dark border border-border-dark text-text-primary font-bold px-6 py-3 text-sm transition flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-dark"
              >
                READ THE PROTOCOL
              </a>
            </div>
          </div>
        </section>

        {/* Bento / Features Grid */}
        <section className="border-b border-border-dark py-16 px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="border border-border-dark p-6 bg-card-dark flex flex-col justify-between h-64">
              <div className="space-y-4">
                <div className="w-10 h-10 border border-border-dark flex items-center justify-center text-primary-green bg-bg-dark">
                  <Globe size={20} />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">Sync Swarms</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Connect locally or peer-to-peer using invite codes. Automatic block synchronization ensures entire coaching staff shares player records and match files.
                </p>
              </div>
              <div className="text-[10px] font-mono text-primary-green uppercase tracking-wider">
                Protocol: p2p-swarm-v1
              </div>
            </div>

            {/* Feature 2 */}
            <div className="border border-border-dark p-6 bg-card-dark flex flex-col justify-between h-64">
              <div className="space-y-4">
                <div className="w-10 h-10 border border-border-dark flex items-center justify-center text-pitch-gold bg-bg-dark">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">Self-Custodial DIDs</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Decentralized Identifiers cryptographically generated on-device. No accounts, no password leaks. You own your identity, signatures, and roster authorizations.
                </p>
              </div>
              <div className="text-[10px] font-mono text-pitch-gold uppercase tracking-wider">
                Identity: p-256 standard
              </div>
            </div>

            {/* Feature 3 */}
            <div className="border border-border-dark p-6 bg-card-dark flex flex-col justify-between h-64">
              <div className="space-y-4">
                <div className="w-10 h-10 border border-border-dark flex items-center justify-center text-primary-green bg-bg-dark">
                  <Brain size={20} />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">QVAC AI Engine</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  On-device analytical assessment. Log matches in real-time to generate post-game tactical reports and weekly athlete rating metrics automatically.
                </p>
              </div>
              <div className="text-[10px] font-mono text-primary-green uppercase tracking-wider">
                Model: local-qvac-eval
              </div>
            </div>

          </div>
        </section>

        {/* Live Workspace Mount */}
        <section id="terminal-workspace" className="py-20 px-6 bg-bg-dark">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold uppercase tracking-tight">Initialize Workspace</h2>
              <p className="text-xs text-text-secondary">
                Generate new cryptographic keys or import an existing P-256 key hex.
              </p>
            </div>
            
            <div className="border border-border-dark p-1 bg-card-dark">
              <div className="border border-border-dark p-6 bg-bg-dark/40">
                <WalletSetup onWalletLoaded={(w) => setWallet(w)} />
              </div>
            </div>
          </div>
        </section>

        {/* Protocol Details */}
        <section id="protocol" className="border-t border-border-dark py-16 px-6 max-w-4xl mx-auto w-full space-y-8">
          <h3 className="text-2xl font-bold uppercase tracking-tight text-center">Operational Architecture</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed text-text-secondary">
            <div className="space-y-3">
              <h4 className="font-bold text-text-primary uppercase tracking-wider">1. Local Storage Ledger</h4>
              <p>
                All databases reside in IndexedDB inside your browser. Offline performance is absolute; network latency has no effect on match operations, match events tracking, or player listings.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-text-primary uppercase tracking-wider">2. Cryptographic Consensus</h4>
              <p>
                Transactions and roster modifications are signed locally by your private key. P2P syncing propagates verified signatures, maintaining decentralized history consensus across coaching nodes.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border-dark bg-card-dark py-6 text-center text-xs text-text-secondary mt-auto">
          <p>&copy; 2026 PitchOS. Built for Tether Developers Cup 2026. Offline &amp; Sovereign.</p>
        </footer>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD WORKSPACE
  return (
    <div className="min-h-screen bg-bg-dark text-text-primary flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border-dark bg-card-dark sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-green flex items-center justify-center text-black font-extrabold text-base select-none">
              P
            </div>
            <div>
              <span className="font-sans font-black text-lg tracking-tight text-text-primary">
                Pitch<span className="text-primary-green">OS</span>
              </span>
              <span className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                Decentralized Football OS
              </span>
            </div>
          </div>

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
              className="text-xs bg-transparent border border-border-dark hover:bg-border-dark px-3 py-1.5 text-text-primary transition cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Quick Wallet Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-card-dark border border-border-dark p-4 sm:p-5">
            <div>
              <h2 className="font-sans text-base font-bold text-text-primary uppercase tracking-tight">Active Workspace</h2>
              <p className="text-xs text-text-secondary mt-0.5">Manage club roster and sync peer logs offline.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-bg-dark border border-border-dark px-4 py-2 flex flex-col items-center min-w-[90px]">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">USDT</span>
                <span className="text-sm font-bold text-text-primary mt-0.5 font-mono">{wallet.balance} ₮</span>
              </div>
              <div className="bg-bg-dark border border-border-dark px-4 py-2 flex flex-col items-center min-w-[90px]">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Loyalty</span>
                <span className="text-sm font-bold text-pitch-gold mt-0.5 font-mono">{wallet.points} PTS</span>
              </div>
            </div>
          </div>

          {/* Sticky Navigation Tabs */}
          <div className="sticky top-[53px] z-40 bg-bg-dark border-b border-border-dark -mx-6 px-6">
            <nav className="flex overflow-x-auto gap-1 scrollbar-none py-1" aria-label="Dashboard tabs">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold py-2 px-3 transition whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-primary-green/10 text-primary-green border border-border-dark border-b-0'
                      : 'text-text-secondary hover:text-text-primary hover:bg-card-dark border border-transparent'
                  }`}
                >
                  <tab.Icon size={14} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                  <span className="uppercase tracking-wider">{tab.label}</span>
                </button>
              ))}
            </nav>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border-dark bg-card-dark py-5 text-center text-xs text-text-secondary">
        <p>&copy; 2026 PitchOS. Built for Tether Developers Cup 2026. Offline &amp; Sovereign.</p>
      </footer>
    </div>
  );
}
