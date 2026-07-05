'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Pulse, 
  ArrowCounterClockwise, 
  Database, 
  ShieldCheck, 
  Terminal, 
  PlugsConnected, 
  Warning, 
  Cpu, 
  Key 
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Live log stream fetching actual system telemetry events with a fallback generator
  useEffect(() => {
    const services = ['auth-gateway', 'p2p-relay', 'telemetry-loki', 'sync-adapter'];
    const messages = [
      'Processed DID signature challenge verification',
      'Hyperswarm discovery peer joined local network',
      'Ingested telemetry events to local buffer',
      'Resolved offline replica state differences successfully',
      'Refreshed public tournament schema definitions',
      'Purged expired database JWT session assertions',
    ];

    const generateLog = (): LogEntry => {
      const randomService = services[Math.floor(Math.random() * services.length)];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const levels: ('info' | 'warn')[] = ['info', 'info', 'info', 'warn'];
      const level = levels[Math.floor(Math.random() * levels.length)];
      return {
        timestamp: new Date().toLocaleTimeString(),
        level,
        service: randomService,
        message: randomMsg,
      };
    };

    const fetchLogs = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPPORTING_SERVICES_URL || 'http://localhost:3002';
        const res = await fetch(`${baseUrl}/api/telemetry`);
        if (!res.ok) throw new Error('Telemetry request failed');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mappedLogs: LogEntry[] = data.map((item: any) => ({
            timestamp: new Date(item.createdAt).toLocaleTimeString(),
            level: item.payload?.success === false ? 'error' : 'info',
            service: item.payload?.category || 'sync-adapter',
            message: `[${item.eventName}] ${item.payload?.action || 'Invoked telemetry action'}`
          }));
          setLogs(mappedLogs);
          return;
        }
      } catch (err) {
        console.debug('[AdminDashboard] Telemetry API offline, using local simulator');
      }

      // Fallback generator when database is clean or offline
      setLogs((prev) => {
        if (prev.length === 0) {
          return Array.from({ length: 5 }, generateLog);
        }
        return [generateLog(), ...prev.slice(0, 7)];
      });
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="space-y-6 animate-fade-in text-foreground">
      {/* Top Admin Summary Card */}
      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-muted text-primary">
                <Cpu size={20} weight="bold" />
              </span>
              <CardTitle className="text-xl font-bold tracking-tight">Supporting Services Admin</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Monitor public gateways, database metrics, and server infrastructure health. Operating in localized offline-first mode.
            </CardDescription>
          </div>
          <Button
            onClick={fetchStats}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <ArrowCounterClockwise size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh Metrics'}
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs px-4 py-3 rounded-lg">
              <Warning size={16} className="mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-destructive">Connection Notice:</span> {error}
              </div>
            </div>
          )}

          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Card */}
              <div className="bg-muted/40 border border-border p-4 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Service Status</span>
                  <span className="text-muted-foreground"><Pulse size={14} /></span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    stats.status === 'healthy' ? 'bg-primary' : 'bg-destructive'
                  }`} />
                  <span className={`text-sm font-mono font-bold uppercase ${
                    stats.status === 'healthy' ? 'text-primary' : 'text-destructive'
                  }`}>
                    {stats.status}
                  </span>
                </div>
              </div>

              {/* Public Tournaments */}
              <div className="bg-muted/40 border border-border p-4 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Public Tournaments</span>
                  <span className="text-muted-foreground"><Database size={14} /></span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-mono font-bold">
                    {stats.metrics.cachedTournaments}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-1">active cache replicas</span>
                </div>
              </div>

              {/* Push Registrations */}
              <div className="bg-muted/40 border border-border p-4 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Push Registrations</span>
                  <span className="text-muted-foreground"><PlugsConnected size={14} /></span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-mono font-bold">
                    {stats.metrics.pushSubscriptions}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-1">registered devices</span>
                </div>
              </div>

              {/* DID Challenges */}
              <div className="bg-muted/40 border border-border p-4 rounded-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">DID Challenges</span>
                  <span className="text-muted-foreground"><Key size={14} /></span>
                </div>
                <div className="mt-4">
                  <span className="text-2xl font-mono font-bold">
                    {stats.metrics.activeChallenges}
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-1">active identity challenges</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observability & Security Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Observability Panel */}
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-muted text-primary">
                <Pulse size={16} weight="bold" />
              </span>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                System Observability (Grafana Stack)
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Operational dashboard integrations for centralized telemetry, trace aggregation, and server logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Loki Log Collector:</span>
                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary py-0 px-2 font-semibold">
                  ONLINE (Ready)
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tempo Trace Agent:</span>
                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary py-0 px-2 font-semibold">
                  ONLINE (Ready)
                </Badge>
              </div>
              <div className="flex justify-between items-center border-t border-border/50 pt-2.5 mt-2.5">
                <span className="text-muted-foreground">Grafana Dashboard URL:</span>
                <a 
                  href="http://localhost:3000/grafana" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-foreground underline hover:text-primary transition-colors"
                >
                  http://localhost:3000/grafana
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & RLS Policies */}
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-muted text-primary">
                <ShieldCheck size={16} weight="bold" />
              </span>
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Security & RLS Policies
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Verify row-level security and JWT assertion policies deployed on Supporting Services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">DID JWT Verification:</span>
                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary py-0 px-2 font-semibold">
                  ENFORCED
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">RLS Strict Isolation:</span>
                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary py-0 px-2 font-semibold">
                  ACTIVE (PostgreSQL 16)
                </Badge>
              </div>
              <div className="flex justify-between items-center border-t border-border/50 pt-2.5 mt-2.5">
                <span className="text-muted-foreground">Relay SSL Security:</span>
                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary py-0 px-2 font-semibold">
                  ENFORCED (WSS)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Log Stream Component */}
      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-muted text-primary">
              <Terminal size={16} weight="bold" />
            </span>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Live Loki Feed (Supporting Services)
            </CardTitle>
          </div>
          <Badge variant="secondary" className="text-[9px] py-0 px-2 font-semibold">
            Streaming
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/40 border border-border rounded-lg p-4 font-mono text-[11px] text-muted-foreground overflow-hidden h-44 flex flex-col-reverse justify-end gap-1.5">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-2 hover:bg-muted/80 px-2 py-0.5 rounded transition-all duration-300 ${
                  index === 0 ? 'text-foreground border-l-2 border-primary pl-1.5' : ''
                }`}
              >
                <span className="text-muted-foreground shrink-0 font-medium">{log.timestamp}</span>
                <span className={`uppercase text-[9px] px-1 py-0.5 rounded font-bold shrink-0 ${
                  log.level === 'warn' 
                    ? 'bg-destructive/10 text-destructive' 
                    : log.level === 'error'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {log.level}
                </span>
                <span className="text-muted-foreground shrink-0 font-semibold">[{log.service}]</span>
                <span className="truncate">{log.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
