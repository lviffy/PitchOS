export interface LogEntry<T = any> {
  seq: number;
  author: string;
  signature: string;
  timestamp: number;
  payload: T;
}

export type SyncCallback<T = any> = (entry: LogEntry<T>) => void;

let HypercoreClass: any = null;
let AutobaseClass: any = null;

async function initRealPearsStack(): Promise<boolean> {
  if (typeof window !== 'undefined' && !(window as any).Pear) {
    // Avoid loading hypercore/autobase on standard browsers to prevent bundle issues
    return false;
  }
  if (HypercoreClass) return true;
  try {
    const hcMod = await import(/* webpackIgnore: true */ 'hypercore');
    const abMod = await import(/* webpackIgnore: true */ 'autobase');
    HypercoreClass = hcMod.default || hcMod;
    AutobaseClass = abMod.default || abMod;
    return true;
  } catch (err) {
    console.warn('[SyncAdapter] Real Hypercore/Autobase modules not available in this environment. Falling back to mocks.');
    return false;
  }
}

export class HypercoreMock<T = any> {
  public key: string;
  private storage: LogEntry<T>[] = [];
  private listeners: Set<SyncCallback<T>> = new Set();
  private realCore: any = null;
  private isPear = false;

  constructor(key: string) {
    this.key = key;
    this.isPear = (globalThis as any).Pear !== undefined;
    if (this.isPear) {
      this.initRealCore();
    }
  }

  private async initRealCore() {
    const success = await initRealPearsStack();
    if (success && HypercoreClass) {
      try {
        const storageDir = `./.pear-storage/${this.key}`;
        this.realCore = new HypercoreClass(storageDir, { valueEncoding: 'json' });
        await this.realCore.ready();
        console.log(`[SyncAdapter] Real Hypercore ready for topic: ${this.key}`);

        this.realCore.on('append', async () => {
          const len = this.realCore.length;
          const entry = await this.realCore.get(len - 1);
          if (entry) {
            this.listeners.forEach(fn => fn(entry));
          }
        });
      } catch (err) {
        console.error('[SyncAdapter] Real Hypercore init failed. Using mock core.', err);
        this.realCore = null;
      }
    }
  }

  async append(author: string, payload: T, signature: string): Promise<number> {
    const entry: LogEntry<T> = {
      seq: this.realCore ? this.realCore.length : this.storage.length,
      author,
      signature,
      timestamp: Date.now(),
      payload
    };

    if (this.realCore) {
      await this.realCore.ready();
      await this.realCore.append(entry);
      return entry.seq;
    }

    this.storage.push(entry);
    this.listeners.forEach(fn => fn(entry));
    return entry.seq;
  }

  async get(seq: number): Promise<LogEntry<T> | null> {
    if (this.realCore) {
      try {
        await this.realCore.ready();
        const entry = await this.realCore.get(seq);
        return entry || null;
      } catch {
        return null;
      }
    }
    return this.storage[seq] || null;
  }

  async length(): Promise<number> {
    if (this.realCore) {
      await this.realCore.ready();
      return this.realCore.length;
    }
    return this.storage.length;
  }

  subscribe(callback: SyncCallback<T>): () => void {
    this.listeners.add(callback);

    if (this.realCore) {
      this.realCore.ready().then(async () => {
        const len = this.realCore.length;
        for (let i = 0; i < len; i++) {
          const entry = await this.realCore.get(i);
          if (entry) callback(entry);
        }
      });
    } else {
      this.storage.forEach(entry => callback(entry));
    }

    return () => {
      this.listeners.delete(callback);
    };
  }

  replicate(other: HypercoreMock<T>) {
    if (this.realCore && other.realCore) {
      try {
        const stream1 = this.realCore.replicate(true, { keepAlive: false });
        const stream2 = other.realCore.replicate(false, { keepAlive: false });
        stream1.pipe(stream2).pipe(stream1);
        return;
      } catch (e) {
        console.error('[SyncAdapter] Real replication failed, falling back.', e);
      }
    }

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
      if (!this.unifiedLog.some(e => e.signature === entry.signature && e.timestamp === entry.timestamp)) {
        this.unifiedLog.push(entry);
        this.unifiedLog.sort((a, b) => a.timestamp - b.timestamp);
        this.listeners.forEach(fn => fn(this.unifiedLog));
      }
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
