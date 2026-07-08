# PitchOS — AI-Powered Decentralized Football Operating System

PitchOS is an offline-first, decentralized operating system for grassroots football clubs to manage rosters, tournaments, live match scoring, prediction pools, and payments — **without a central database or internet dependency**.

Designed and engineered for the **Tether Developers Cup 2026**.

---

## 1. System Architecture

PitchOS operates using a decoupled, sovereign, monorepo architecture. The application layers are split into distinct workspaces:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js Client (apps/client)                    │
│                                                                        │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────┐  │
│  │   UI (Pages / Roster) │ │  AI Coach / RAG       │ │ Wallet Setup │  │
│  └───────────┬───────────┘ └───────────┬───────────┘ └──────┬───────┘  │
│              │                         │                    │          │
│              └─────────────────────────┼────────────────────┘          │
│                                        ▼                               │
│                         Dexie Database / IndexedDB                     │
│                                        ▲                               │
│                                        │                               │
│                         ┌──────────────┴──────────────┐                │
│                         │   packages/sync-adapter     │                │
│                         │   (P2P replication stream)  │                │
│                         └──────────────┬──────────────┘                │
│                                        │                               │
│              ┌─────────────────────────┴─────────────────────────┐     │
│              ▼ (Pear Environment)                                ▼ (Browser Fallback) │
│       Hyperswarm DHT &                                  WebSocket Relay│
│       Hypercore Log                                     Service        │
└──────────────┬───────────────────────────────────────────────────┼─────┘
               │                                                   │
               ▼                                                   ▼
       Native P2P Peers                                     Stateless Broadcast
```

### Monorepo Workspaces & Structure
*   **Client Core (`apps/client`)**: Next.js App Router, Tailwind CSS v4, Dexie (IndexedDB wrapper), and Local Storage (for private key persistence).
*   **Decentralized Sync (`packages/sync-adapter`)**: Manages the append-only logs using `Hypercore` and `Autobase`. Implements conflict resolution and coordinates replication.
*   **Self-Custodial Wallet (`packages/wallet-adapter`)**: Client-side P-256 ECDSA key pair generator. Integrates the Tether Wallet Development Kit (WDK) and manages Liquid Network transactions.
*   **On-Device QVAC AI Coach (`apps/client/src/features/ai`)**: Local inference engine streaming token completions using the QVAC SDK and fallback heuristic rules.
*   **WebSocket Relay (`apps/relay-service`)**: Stateless Bun/WebSocket signaling proxy to facilitate NAT-traversal and event broadcasting for standard browser fallbacks.

---

## 2. Tether SDK Integrations & Technical Deep-Dive

PitchOS implements the three Tether Developer Cup tracks:

### A. Pears Track (P2P Discovery & Sync)
* **Code Location**: [`packages/sync-adapter/src/p2p-client.ts`](./packages/sync-adapter/src/p2p-client.ts) and [`packages/sync-adapter/src/index.ts`](./packages/sync-adapter/src/index.ts)
* **Design Decision**: Peer-to-peer data replication utilizes a dual-mode synchronization client:
  1. **Native Pear Runtime Mode**: Initializes a `Hyperswarm` instance, creates a SHA-256 hash of the human-readable swarm topic, joins the DHT topic, and pipes TCP streams directly into local `hypercore` instances.
  2. **Standard Browser Fallback Mode**: If running outside the Pear container, the client communicates via `WebSocket` to `apps/relay-service`. Signed event blocks are serialized and broadcast to all topic-registered peers.
* **Conflict Resolution**: Roster edits, match events, and message mutations are serialized as cryptographically signed log entries. Multi-writer logs are merged and sorted chronologically using timestamp indexing, with deduplication performed against the entry signature hash.

```typescript
export interface LogEntry<T = any> {
  seq: number;
  author: string;
  signature: string;
  timestamp: number;
  payload: T;
}
```

---

### B. QVAC Track (On-Device Offline AI)
* **Code Location**: [`apps/client/src/features/ai/qvac-service.ts`](./apps/client/src/features/ai/qvac-service.ts)
* **Design Decision**: 100% of LLM execution runs on the client. At runtime, the service queries `LLAMA_3_2_1B_INST_Q4_0` via `@qvac/sdk` in the Pear WebGPU runtime (utilizing Vulkan/WebGPU hardware acceleration).
* **AI Pipelines**:
  * **Offline RAG**: Queries search a local tactical playbook database using keyword matching and substring scoring, appending playbooks directly into the LLM system prompt.
  * **Tool Intent Detection**: Categorizes questions about rosters, match history, or wallet balances, queries IndexedDB tables locally, and injects data directly into the prompt context.
  * **Post-Match Diagnostics**: Generates match summaries, MVP evaluations, and algorithmic player ratings:
    $$\text{Rating} = 7.0 + (\text{goals} \times 1.5) - (\text{cards} \times 0.8) + \text{position\_bonus}$$
  * **Match Probability Prediction**: Deterministically calculates probabilities using team name hashes and prompts local Llama for 3 tactical bullet points.

---

### C. WDK Track (Self-Custodial Wallet Policies)
* **Code Location**: [`apps/client/src/features/wallet/wallet-store.ts`](./apps/client/src/features/wallet/wallet-store.ts) and [`packages/wallet-adapter/src/index.ts`](./packages/wallet-adapter/src/index.ts)
* **Design Decision**: Initializes the `@tetherto/wdk` engine. We subclass WDK's `WalletManager` and `IWalletAccount` base classes for two discrete payment adapters:
  1. **PitchOS Ledger**: An offline, on-device ledger stored in IndexedDB. All balance movements are signed locally using browser-native Web Crypto P-256 ECDSA keypairs.
  2. **Liquid Testnet**: Generates witness program scripts using SHA-256 and Bech32 encoding to derive standard `tlq1q...` Liquid testnet addresses. Queries asset balances (L-USDT and L-BTC) against Blockstream's Esplora APIs.
* **Spending Limits Policy**: Employs WDK policy evaluation rules to intercept transfer actions. A project-level spending limit policy (`usdt-spending-limit`) rejects transfers exceeding 50 USDT:

```typescript
wdk.registerPolicy({
  id: 'usdt-spending-limit',
  name: 'USDT Spending Limit',
  scope: 'project',
  rules: [{
    name: 'Limit Rule',
    reason: 'USDT transaction exceeds the active policy spending limit of 50 USDT.',
    operation: 'transfer',
    action: 'DENY',
    conditions: [
      (context) => {
        const amount = Number(context.params?.amount || 0);
        const token = context.params?.token || 'USDT';
        return token === 'USDT' && amount > 50;
      }
    ]
  }]
});
```

---

## 3. Dynamic Degradation Grid

PitchOS degrades gracefully depending on the hosting environment, ensuring zero application crashes when native desktop tools are unavailable:

| Feature Layer | Pear Desktop Container | Standard Web Sandbox | Offline Sandbox |
|---|---|---|---|
| **P2P Discovery** | Direct Kademlia DHT | WebSocket Signaling | Disabled (Local Only) |
| **Sync Log** | Disk-Backed Hypercores | In-Memory Core Mock | In-Memory Core Mock |
| **AI Inference** | On-Device GPU Llama-3 | Rule-Based Fallback | Rule-Based Fallback |
| **Identity / Keys** | WDK Mnemonic Seed | CSPRNG Web Crypto | CSPRNG Web Crypto |
| **Ledger Policies** | WDK Rule Execution | Browser Ledger Emulation | Browser Ledger Emulation |
| **Liquid Network** | Blockstream Esplora API | Blockstream Esplora API | Offline Cache |

---

## 4. Quick Start & Local Execution

PitchOS uses Bun workspaces for high-speed local package resolution.

### Option A: Pear Desktop Container (Recommended for full P2P & Local AI testing)

Running in the Pear container enables real `hyperswarm` discovery, `hypercore` sync replication, and `@qvac/sdk` on-device WebGPU LLM inference:

**1. Install CLI Prereqs:**
```bash
# Install Pear CLI globally
npm install -g pear

# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash
```

**2. Launch Developers Suite:**
* **Linux/macOS:**
  ```bash
  chmod +x ./start-dev.sh
  ./start-dev.sh
  ```
* **Windows CMD:**
  ```cmd
  start-dev.bat
  ```
* **Windows PowerShell:**
  ```powershell
  .\start-dev.ps1
  ```

This script concurrently boots the Next.js frontend on `localhost:3000`, the WebSocket relay on `localhost:4000`, and opens the sovereign **Pear Desktop Application**.

---

### Option B: Standard Browser Sandbox (Fallback Mode)

To test the application flow inside a standard browser:

```bash
# Install Monorepo dependencies
npm install

# Start local dev servers
npm run dev
```
Open `http://localhost:3000` in your browser. 

---

## 5. Step-by-Step E2E Judging Script

Open two side-by-side browser sessions (e.g. Chrome Standard and Chrome Incognito) pointing to `http://localhost:3000` to evaluate the entire pipeline:

### Step 1: Self-Custodial Wallet Onboarding (< 1 Min)
1. Navigate to `http://localhost:3000`.
2. Click **Create New Wallet**.
3. A P-256 keypair is generated locally using Web Crypto. Note the derived `did:pitchos:<pubkey>` format.
4. The local faucet deposits **500 USDT** and **1000 Loyalty Points** into the local DB transaction table via two signed ledger entries.

### Step 2: DHT Roster Synchronization
1. Under the **Club Management** tab, type a sync topic (e.g., `wolves-derby-2026`) and click **Join Sync Swarm**.
2. Open your incognito window and join the *same* topic. Note the green **Sync Connected** status badge.
3. On Browser A, click **Create Club** (e.g., "London Wolves") and click **Add Player** (e.g., "Sarah", Midfielder, #10).
4. View Browser B: Sarah's profile and the club card populate automatically under 1 second.
5. Inspect the network tab: no REST APIs or centralized servers were queried.

### Step 3: Match Logging & On-Device AI Feedback
1. Go to the **Match Center** tab and click **Schedule Match** ("London Wolves" vs "Manchester Red").
2. Select the match and click **Start Match Live**.
3. Log events: add a goal for Sarah and a yellow card. Watch Browser B update instantly.
4. Click **End Match & Run AI Analytics**.
5. QVAC AI computes player ratings, identifies the MVP, and streams a tactical report locally in under 2 seconds.

### Step 4: Knockout Tournaments & Payout Escrows
1. Under the **Tournaments** tab, initialize a tournament ("Summer Cup", fee = 100 Points).
2. On Browser A, register "London Wolves" and "Liverpool FC". Note that the fee is deducted via WDK transactions.
3. On Browser B, register "Manchester Red" and "Chelsea FC".
4. Click **Generate Bracket & Start** to render the visual semi-final tree.
5. Complete the fixtures in the Match Center to advance the winning teams automatically.

### Step 5: Prediction Circles & Escrow Settlement
1. Navigate to the **Predictions** tab and create a prediction pool for the grand final.
2. Observe QVAC generating pre-match win probabilities and bulleted reasons.
3. Submit a prediction (your entry fee is escrowed in the ledger).
4. Resolve the match, return to predictions, and click **Distribute Points Escrow** to pay correct predictors.

---

## 6. Project Workspaces

```
├── apps
│   ├── client             # Next.js UI, QVAC and DB State
│   ├── next-app           # Supporting services (telemetry stub)
│   ├── pear-desktop       # Pear Electron Desktop shell
│   └── relay-service      # WebSocket signaling fallback
├── packages
│   ├── shared-types       # Common data structures and interfaces
│   ├── sync-adapter       # P2P client and Hypercore/Autobase modules
│   └── wallet-adapter     # WDK integration and P-256 Web Crypto keys
```

---

## 7. License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](./LICENSE) file for details.
