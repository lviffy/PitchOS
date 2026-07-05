import { HypercoreMock } from './index';

export class P2PClient {
  private ws: WebSocket | null = null;
  private url: string;
  private did: string;
  private topic: string;
  private core: HypercoreMock;
  private isConnected = false;
  private isConnecting = false;
  private onConnectionChange: ((connected: boolean) => void) | null = null;
  private unsubscribeCore: (() => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string, did: string, topic: string, core: HypercoreMock) {
    this.url = url;
    this.did = did;
    this.topic = topic;
    this.core = core;

    // Subscribe to core ONCE in constructor — not in connect()
    this.unsubscribeCore = this.core.subscribe((entry) => {
      this.broadcastAppend(entry);
    });
  }

  connect(onConnectionChange?: (connected: boolean) => void) {
    if (onConnectionChange) {
      this.onConnectionChange = onConnectionChange;
    }

    // Guard against double-connect
    if (this.isConnecting || this.isConnected) {
      return;
    }
    this.isConnecting = true;
    
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.error('[P2PClient] Connection error', e);
      this.isConnecting = false;
      return;
    }

    this.ws.onopen = () => {
      console.log(`[P2PClient] WebSocket connected, registering did=${this.did}`);
      this.isConnected = true;
      this.isConnecting = false;
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

          case 'signal': {
            // Receive remote block append
            const { payload } = data;
            if (payload && payload.type === 'sync_append') {
              const entry = payload.entry;
              console.log('[P2PClient] Received remote sync entry:', entry);
              this.applySyncEntry(entry);
            }
            break;
          }

          case 'error':
            console.error('[P2PClient] Server error:', data.message);
            break;
        }
      } catch (err) {
        console.error('[P2PClient] Message parsing failed', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[P2PClient] WebSocket closed, retrying in 5s...');
      this.isConnected = false;
      this.isConnecting = false;
      this.onConnectionChange?.(false);
      // Clear any existing reconnect timer before scheduling a new one
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
      }
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 5000);
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror, so just mark state here
      this.isConnecting = false;
    };
  }

  private sendSyncPayload() {
    // Send all existing entries in core log
    this.core.length().then(async len => {
      for (let i = 0; i < len; i++) {
        const entry = await this.core.get(i);
        if (entry) {
          this.broadcastAppend(entry);
        }
      }
    });
  }

  private broadcastAppend(entry: any) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

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

  private async applySyncEntry(entry: any) {
    const existing = await this.core.get(entry.seq);
    if (!existing) {
      // Append matching remote sequence to local replica
      await this.core.append(entry.author, entry.payload, entry.signature);
    }
  }

  disconnect() {
    // Clean up reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    // Unsubscribe from core to prevent further broadcasts
    if (this.unsubscribeCore) {
      this.unsubscribeCore();
      this.unsubscribeCore = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.ws?.close();
    this.ws = null;
  }
}
