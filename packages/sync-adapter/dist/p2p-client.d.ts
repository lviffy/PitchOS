import { HypercoreMock } from './index';
export declare class P2PClient {
    private ws;
    private url;
    private did;
    private topic;
    private core;
    private isConnected;
    private onConnectionChange;
    constructor(url: string, did: string, topic: string, core: HypercoreMock);
    connect(onConnectionChange?: (connected: boolean) => void): void;
    private sendSyncPayload;
    private broadcastAppend;
    private applySyncEntry;
    disconnect(): void;
}
