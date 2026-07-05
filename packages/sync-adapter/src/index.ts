export interface LogEntry<T = any> {
  seq: number;
  author: string;
  signature: string;
  timestamp: number;
  payload: T;
}

export type SyncCallback<T = any> = (entry: LogEntry<T>) => void;

export class HypercoreMock<T = any> {
  public key: string;
  private storage: LogEntry<T>[] = [];
  private listeners: Set<SyncCallback<T>> = new Set();

  constructor(key: string) {
    this.key = key;
  }

  async append(author: string, payload: T, signature: string): Promise<number> {
    const entry: LogEntry<T> = {
      seq: this.storage.length,
      author,
      signature,
      timestamp: Date.now(),
      payload
    };
    this.storage.push(entry);
    this.listeners.forEach(fn => fn(entry));
    return entry.seq;
  }

  async get(seq: number): Promise<LogEntry<T> | null> {
    return this.storage[seq] || null;
  }

  async length(): Promise<number> {
    return this.storage.length;
  }

  subscribe(callback: SyncCallback<T>): () => void {
    this.listeners.add(callback);
    // Emit existing elements
    this.storage.forEach(entry => callback(entry));
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Simulate P2P replication stream
  replicate(other: HypercoreMock<T>) {
    // Sync current
    this.storage.forEach(entry => {
      if (entry.seq >= other.storage.length) {
        other.storage.push(entry);
        other.listeners.forEach(fn => fn(entry));
      }
    });
    other.storage.forEach(entry => {
      if (entry.seq >= this.storage.length) {
        this.storage.push(entry);
        this.listeners.forEach(fn => fn(entry));
      }
    });
  }
}

export class AutobaseMock {
  private cores: Map<string, HypercoreMock> = new Map();
  private unifiedLog: LogEntry[] = [];
  private listeners: Set<(log: LogEntry[]) => void> = new Set();

  registerCore(core: HypercoreMock) {
    this.cores.set(core.key, core);
    core.subscribe((entry) => {
      this.unifiedLog.push(entry);
      // Sort causally using timestamp (as mock vector clock / Lamport clock)
      this.unifiedLog.sort((a, b) => a.timestamp - b.timestamp);
      this.listeners.forEach(fn => fn(this.unifiedLog));
    });
  }

  subscribeUnified(callback: (log: LogEntry[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.unifiedLog);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export * from './p2p-client';
