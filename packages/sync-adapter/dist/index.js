export class HypercoreMock {
    key;
    storage = [];
    listeners = new Set();
    constructor(key) {
        this.key = key;
    }
    async append(author, payload, signature) {
        const entry = {
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
    async get(seq) {
        return this.storage[seq] || null;
    }
    async length() {
        return this.storage.length;
    }
    subscribe(callback) {
        this.listeners.add(callback);
        // Emit existing elements
        this.storage.forEach(entry => callback(entry));
        return () => {
            this.listeners.delete(callback);
        };
    }
    // Simulate P2P replication stream
    replicate(other) {
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
    cores = new Map();
    unifiedLog = [];
    listeners = new Set();
    registerCore(core) {
        this.cores.set(core.key, core);
        core.subscribe((entry) => {
            this.unifiedLog.push(entry);
            // Sort causally using timestamp (as mock vector clock / Lamport clock)
            this.unifiedLog.sort((a, b) => a.timestamp - b.timestamp);
            this.listeners.forEach(fn => fn(this.unifiedLog));
        });
    }
    subscribeUnified(callback) {
        this.listeners.add(callback);
        callback(this.unifiedLog);
        return () => {
            this.listeners.delete(callback);
        };
    }
}
export * from './p2p-client';
