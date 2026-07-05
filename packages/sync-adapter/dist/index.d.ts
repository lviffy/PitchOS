export interface LogEntry<T = any> {
    seq: number;
    author: string;
    signature: string;
    timestamp: number;
    payload: T;
}
export type SyncCallback<T = any> = (entry: LogEntry<T>) => void;
export declare class HypercoreMock<T = any> {
    key: string;
    private storage;
    private listeners;
    constructor(key: string);
    append(author: string, payload: T, signature: string): Promise<number>;
    get(seq: number): Promise<LogEntry<T> | null>;
    length(): Promise<number>;
    subscribe(callback: SyncCallback<T>): () => void;
    replicate(other: HypercoreMock<T>): void;
}
export declare class AutobaseMock {
    private cores;
    private unifiedLog;
    private listeners;
    registerCore(core: HypercoreMock): void;
    subscribeUnified(callback: (log: LogEntry[]) => void): () => void;
}
export * from './p2p-client';
