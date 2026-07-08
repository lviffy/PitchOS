const fs = require('fs');

const diagram1 = `graph TD
    subgraph ClientA [Client Node A]
        DexieA[(IndexedDB)] <--> SyncA[Sync Adapter]
        SyncA <--> CoreA[Hypercore Mock]
    end
    subgraph ClientB [Client Node B]
        CoreB[Hypercore Mock] <--> SyncB[Sync Adapter]
        SyncB <--> DexieB[(IndexedDB)]
    end
    subgraph Network [P2P Network / Discovery]
        Swarm[Hyperswarm DHT]
        Relay[WebSocket Relay Fallback]
    end
    CoreA <--> Swarm
    Swarm <--> CoreB
    SyncA <--> Relay
    Relay <--> SyncB`;

const diagram2 = `graph TD
    Query[User Chat Input] --> Intent[Intent Detector]
    Intent -->|Matches Roster/Matches/Wallet| Tool[Local IndexedDB Tool]
    Intent -->|Generic Tactical Query| RAG[Local Playbook RAG]
    Tool -->|Roster & Match Data| Context[Prompt Context Builder]
    RAG -->|Tactical Playbooks| Context
    Query --> Context
    Context -->|Assembled Prompt| Model[Local Llama-3.2-1B]
    Model -->|GPU WebGPU / WASM offline| Inference[Token Stream / Output]`;

const diagram3 = `graph LR
    Initiate[Initiate USDT Transfer] --> WDK[WDK Wallet Account]
    WDK --> Policy[Policy Engine]
    Policy --> Rule{USDT > 50?}
    Rule -->|Yes| Deny[DENY Transaction / Throw PolicyViolationError]
    Rule -->|No| Allow[ALLOW Transaction]
    Allow --> Sign[Sign Payload via Browser Web Crypto P-256]
    Sign --> Write[Write signed tx block to Dexie Ledger]`;

function toBase64Url(str) {
    return Buffer.from(str).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

console.log('Diagram 1 link:');
console.log('https://mermaid.ink/img/' + toBase64Url(diagram1));
console.log('\nDiagram 2 link:');
console.log('https://mermaid.ink/img/' + toBase64Url(diagram2));
console.log('\nDiagram 3 link:');
console.log('https://mermaid.ink/img/' + toBase64Url(diagram3));
