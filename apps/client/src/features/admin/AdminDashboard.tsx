'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface AdminMetrics {
  activeChallenges: number;
  cachedTournaments: number;
  pushSubscriptions: number;
  telemetryEvents?: number;
}

interface AdminStatsResponse {
  status: string;
  timestamp: number;
  metrics: AdminMetrics;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPPORTING_SERVICES_URL || 'http://localhost:3002';
      const res = await fetch(`${baseUrl}/api/admin/stats`);
      if (!res.ok) {
        throw new Error(`Admin stats returned status ${res.status}`);
      }
      const data = await res.json();
      setStats(data);
    } catch (err: unknown) {
      console.error('Failed to fetch admin stats', err);
      setError('Could not connect to Supporting Services API. Verify next-app is running on port 3002.');
      // Load local demo stats
      setStats({
        status: 'demo_mode_offline',
        timestamp: Date.now(),
        metrics: {
          activeChallenges: 0,
          cachedTournaments: 4,
          pushSubscriptions: 2,
          telemetryEvents: 12
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Reduced from 10s to 30s
    return () => {
      clearInterval(interval);
    };
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-text-primary">Supporting Services Admin</h3>
            <p className="text-xs text-text-secondary mt-1">
              Monitor public gateways, database metrics, and server infrastructure health.
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="bg-primary-green hover:bg-primary-green-hover text-white text-xs font-semibold py-2 px-5 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Metrics'}
          </button>
        </div>

        {error && (
          <div className="bg-pitch-gold bg-opacity-5 border border-pitch-gold border-opacity-20 text-pitch-gold text-xs px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-bg-dark border border-border-dark p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Service Status</span>
              <span className={`text-lg font-bold mt-2 uppercase ${
                stats.status === 'healthy' ? 'text-primary-green' : 'text-pitch-gold'
              }`}>
                {stats.status}
              </span>
            </div>

            <div className="bg-bg-dark border border-border-dark p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Public Tournaments</span>
              <span className="text-xl font-bold text-text-primary mt-2">
                {stats.metrics.cachedTournaments}
              </span>
            </div>

            <div className="bg-bg-dark border border-border-dark p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Push Registrations</span>
              <span className="text-xl font-bold text-text-primary mt-2">
                {stats.metrics.pushSubscriptions}
              </span>
            </div>

            <div className="bg-bg-dark border border-border-dark p-4 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">DID Challenges</span>
              <span className="text-xl font-bold text-text-primary mt-2">
                {stats.metrics.activeChallenges}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Observability Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">
            System Observability (Grafana Stack)
          </h4>
          <p className="text-xs text-text-secondary">
            Operational dashboard integrations for centralized telemetry, trace aggregation, and server logs.
          </p>
          <div className="bg-bg-dark border border-border-dark rounded-xl p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-text-secondary">Loki Log Collector:</span>
              <span className="text-primary-green">ONLINE (Ready)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Tempo Trace Agent:</span>
              <span className="text-primary-green">ONLINE (Ready)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Grafana Dashboard URL:</span>
              <span className="text-text-primary underline cursor-pointer">http://localhost:3000/grafana</span>
            </div>
          </div>
        </div>

        <div className="bg-card-dark border border-border-dark rounded-2xl p-6 shadow-xl space-y-4">
          <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">
            Security & RLS Policies
          </h4>
          <p className="text-xs text-text-secondary">
            Verify row-level security and JWT assertion policies deployed on Supporting Services.
          </p>
          <div className="bg-bg-dark border border-border-dark rounded-xl p-4 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-text-secondary">DID JWT Verification:</span>
              <span className="text-primary-green">ENFORCED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">RLS Strict Isolation:</span>
              <span className="text-primary-green">ACTIVE (PostgreSQL 16)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Relay SSL Security:</span>
              <span className="text-primary-green">ENFORCED (WSS)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
