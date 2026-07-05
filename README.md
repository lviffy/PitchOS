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

## 2. Quick Start

Run the entire suite locally using Bun or Node. NPM workspaces are configured.

### Boot Dev Environment

From the monorepo root, install dependencies and start both the Next.js client (`localhost:3000`) and the WebSocket Relay (`ws://localhost:3001`):

```bash
# Install dependencies
npm install

# Start client and relay in parallel
npm run dev
```

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

## 4. Workspaces & Structure

```
├── apps
│   ├── client             # Next.js UI, QVAC and DB State
│   └── relay-service      # WebSocket signaling fallback
├── packages
│   ├── shared-types       # Common data structures and auth contracts
│   ├── sync-adapter       # P2P client and Hypercore mock
│   └── wallet-adapter     # Web Crypto keypair and DID utilities
```
