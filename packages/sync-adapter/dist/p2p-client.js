export class P2PClient {
    ws = null;
    url;
    did;
    topic;
    core;
    isConnected = false;
    onConnectionChange = null;
    constructor(url, did, topic, core) {
        this.url = url;
        this.did = did;
        this.topic = topic;
        this.core = core;
    }
    connect(onConnectionChange) {
        if (onConnectionChange) {
            this.onConnectionChange = onConnectionChange;
        }
        try {
            this.ws = new WebSocket(this.url);
        }
        catch (e) {
            console.error('[P2PClient] Connection error', e);
            return;
        }
        this.ws.onopen = () => {
            console.log(`[P2PClient] WebSocket connected, registering did=${this.did}`);
            this.isConnected = true;
            this.onConnectionChange?.(true);
            // Register did and topic
            this.ws?.send(JSON.stringify({
                type: 'register',
                did: this.did,
                topic: this.topic
            }));
        };
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'registered':
                        console.log('[P2PClient] Registration successful, session ID:', data.sessionId);
                        // Sync current items on startup
                        this.sendSyncPayload();
                        break;
                    case 'signal':
                        // Receive remote block append
                        const { payload } = data;
                        if (payload && payload.type === 'sync_append') {
                            const entry = payload.entry;
                            console.log('[P2PClient] Received remote sync entry:', entry);
                            this.applySyncEntry(entry);
                        }
                        break;
                    case 'error':
                        console.error('[P2PClient] Server error:', data.message);
                        break;
                }
            }
            catch (err) {
                console.error('[P2PClient] Message parsing failed', err);
            }
        };
        this.ws.onclose = () => {
            console.log('[P2PClient] WebSocket closed, retrying in 5s...');
            this.isConnected = false;
            this.onConnectionChange?.(false);
            setTimeout(() => this.connect(), 5000);
        };
        // Listen to local changes to broadcast
        this.core.subscribe((entry) => {
            this.broadcastAppend(entry);
        });
    }
    sendSyncPayload() {
        // Send all existing entries in core log
        this.core.length().then(async (len) => {
            for (let i = 0; i < len; i++) {
                const entry = await this.core.get(i);
                if (entry) {
                    this.broadcastAppend(entry);
                }
            }
        });
    }
    broadcastAppend(entry) {
        if (!this.isConnected || !this.ws)
            return;
        // Send payload. In a real system, this is TURN fallback or WebRTC data channel.
        // In our browser/relay MVP setup, we broadcast to all other DIDs in the topic channel.
        this.ws.send(JSON.stringify({
            type: 'signal',
            targetDid: 'broadcast_topic_peers', // Special keyword handled by relay to forward to all peers
            payload: {
                type: 'sync_append',
                entry
            }
        }));
    }
    async applySyncEntry(entry) {
        const existing = await this.core.get(entry.seq);
        if (!existing) {
            // Append matching remote sequence to local replica
            await this.core.append(entry.author, entry.payload, entry.signature);
        }
    }
    disconnect() {
        this.ws?.close();
        this.ws = null;
    }
}
