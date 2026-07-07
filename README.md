# PitchOS — AI-Powered Decentralized Football Operating System

PitchOS is an offline-first, decentralized operating system for grassroots football clubs to manage rosters, tournaments, live match scoring, prediction pools, and payments — **without a central database or internet dependency**.

Designed for the **Tether Developers Cup 2026**.

---

## 1. Project Architecture

PitchOS operates using a decoupled, sovereign architecture:

*   **Client-Local Core (`apps/client`)**: Next.js App Router, Tailwind CSS v4, Dexie (IndexedDB local wrapper), and Local Storage (self-custodial wallet private keys).
*   **Decentralized Sync (`packages/sync-adapter`)**: Replicates append-only log events using `HypercoreMock` blocks. Runs P2P replication fallbacks over our WebSocket relay.
*   **Web Crypto Wallet (`packages/wallet-adapter`)**: Client-side P-256 ECDSA key pair generator. Derives identity DIDs of format `did:pitchos:<pubkey>`.
*   **On-Device QVAC AI Coach (`apps/client/src/features/ai`)**: Local diagnostic execution engine for player performance feedback, tactical assistant drills, and prediction rationale logic.
*   **WebSocket Relay (`apps/relay-service`)**: Stateless Node signaling proxy helping NAT-traversal and connection coordination.

---

## 2. Quick Start & Execution

Run the entire suite locally. NPM workspaces are configured.

### Prerequisites

To evaluate the full Tether developer stack (real P2P swarming and on-device AI inference), you should run the application inside the Pear Desktop container.

1. **Install Pear CLI** globally:
   ```bash
   npm install -g pear
   ```
2. **Install Bun** (if not installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

### Execution Options

#### Option A: Pear Desktop Container (Recommended for full P2P & Local AI testing)

Running in the Pear container enables real `hyperswarm` discovery, `hypercore` sync replication, and `@qvac/sdk` on-device Vulkan LLM inference:

```bash
# Make the startup script executable and run it
chmod +x ./start-dev.sh
./start-dev.sh
```
This script boots the Next.js frontend, backend/relay servers, and launches the sovereign **Pear Desktop Application**.

#### Option B: Standard Browser Sandbox (Fallback Mode)

If you only want to test the UI logic in a standard browser:

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```
Open `http://localhost:3000` in your browser. Note that in standard browsers, network sync will fall back to the WebSocket signaling relay, and AI operations will fall back to local rule-based heuristics.

---

## 3. Tether SDK Integrations & Track Compliance

PitchOS integrates the three Tether Developer Cup tracks:

### Pears Track (P2P Discovery & Sync)
* **Code Location**: [packages/sync-adapter](file:///home/lviffy/Projects/PitchOS/packages/sync-adapter) and [P2PClient](file:///home/lviffy/Projects/PitchOS/packages/sync-adapter/src/p2p-client.ts)
* **Compliance**: When running within the Pear environment, `P2PClient` initializes a real `hyperswarm` instance, joins a DHT topic hash, and pipes connections directly into local `hypercore` instances for replicate synchronization. It does not rely on WebRTC.

### QVAC Track (On-device Offline AI)
* **Code Location**: [qvac-service.ts](file:///home/lviffy/Projects/PitchOS/apps/client/src/features/ai/qvac-service.ts)
* **Compliance**: All workloads execute 100% locally. The service dynamically loads the `LLAMA_3_2_1B_INST_Q4_0` model via `@qvac/sdk` in the Pear WebGPU runtime and executes streaming inference offline. Cloud APIs are completely disabled.

### WDK Track (Self-custodial Wallet Policies)
* **Code Location**: [wallet-store.ts](file:///home/lviffy/Projects/PitchOS/apps/client/src/features/wallet/wallet-store.ts) and [wallet-adapter](file:///home/lviffy/Projects/PitchOS/packages/wallet-adapter)
* **Compliance**: Initializes the `@tetherto/wdk` engine. It implements a self-custodial account and registers an active project policy (`usdt-spending-limit`) to deny any USDT transfer greater than 50.

---


## 3. Step-by-Step Judging Validation Script (100% Offline Capable)

To verify the E2E capabilities of PitchOS, run a second client session in an Incognito window:

### Step 1: Self-Custodial Wallet Onboarding (< 1 Minute)
1. Go to `http://localhost:3000`.
2. Click **Create New Wallet**.
3. A P-256 keypair is generated locally. Note the derived `did:pitchos:...` identity.
4. You start with **500 USDT** and **1000 Loyalty Points** (mock balances).

### Step 2: Roster & Sync Swarm Connect
1. In the **Club Management** tab, type a sync topic (e.g. `wolves-derby-2026`) and click **Join Sync Swarm**.
2. Go to your incognito session and join the *same* swarm topic. Note the green **Sync Connected** status indicator.
3. On Browser A, click **Create Club** (e.g. "London Wolves").
4. On Browser A, click **Add Player** (e.g. "Sarah", Midfielder, Jersey #10).
5. Open Browser B: the club profile and Sarah's roster profile appear automatically under 1 second.
6. Check the network tab: no external APIs or cloud databases were queried.

### Step 3: Live Match Center & QVAC AI Feedback
1. Go to the **Match Center** tab.
2. Schedule a match: "London Wolves" vs "Manchester Red".
3. Select the scheduled match in the list, and click **Start Match Live**.
4. Log events: a goal (select Sarah) and a substitution.
5. In your incognito session, the scoreboard and timeline update live in real time.
6. Click **End Match & Run AI Analytics**.
7. The match stops. QVAC AI generates a comprehensive technical report, tactical recommendations, standout MVP name, and player ratings in under 2 seconds.

### Step 4: Knockout Tournaments & Payment Escrows
1. Go to the **Tournaments** tab.
2. Initialize a tournament (e.g. "Summer Cup", fee = 100 Points, max teams = 4).
3. On Browser A, register "London Wolves" and "Liverpool FC".
4. On Browser B, register "Manchester Red" and "Chelsea FC".
5. Note that registering deducts 100 points from your balance and appends a signed WDK tx hash to the ledger.
6. Click **Generate Bracket & Start**.
7. The visual knockout tree displays the Semi-finals.
8. Go to Match Center, play/complete the fixtures, and observe the winners automatically advancing to the Grand Final.

### Step 5: Prediction Circles & Payout Settlements
1. Go to the **Predictions** tab.
2. Create a prediction pool for an upcoming match (e.g. fee = 100 points).
3. Open the pool: QVAC AI automatically generates winning probabilities and bulleted reasons.
4. Submit a prediction (e.g. Home Win). Entry fee points are escrowed.
5. Go to Match Center, complete the match, and return to Predictions.
6. Click **Distribute Points Escrow**: correct predictors are paid out and points accrue immediately in their wallet balance.

---

## 5. Workspaces & Structure

```
├── apps
│   ├── client             # Next.js UI, QVAC and DB State
│   ├── next-app           # Supporting services (telemetry)
│   ├── pear-desktop       # Pear Electron Desktop shell
│   └── relay-service      # WebSocket signaling fallback
├── packages
│   ├── shared-types       # Common data structures and auth contracts
│   ├── sync-adapter       # P2P client and Hypercore/Autobase modules
│   └── wallet-adapter     # WDK integration and P-256 Web Crypto keys
```

---

## 6. License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](file:///home/lviffy/Projects/PitchOS/LICENSE) file for details.
