# PitchOS Mock & Demo Data Guide

This document describes all the mock datasets, initial balances, and fallback rules used within **PitchOS** to support standard browser previews, offline validation, and telemetry diagnostics.

---

## 1. Self-Custodial Wallet (WDK Adapter)
* **Location**: [wallet-store.ts](file:///home/lviffy/Projects/PitchOS/apps/client/src/features/wallet/wallet-store.ts)
* **Initial Balances**:
  When a user creates a new wallet (generating a BIP-39 mnemonic and key pair), the wallet state is seeded with demo balances:
  * **USDT Balance**: `500` USDT (used to simulate registration entry fees for real-money tournaments).
  * **Points Balance**: `1000` points (used for free point-based prediction markets).

---

## 2. Local AI Coach (QVAC SDK Fallback)
* **Location**: [qvac-service.ts](file:///home/lviffy/Projects/PitchOS/apps/client/src/features/ai/qvac-service.ts)
* **Fallback Triggers**:
  If PitchOS runs in a standard browser environment lacking WebGPU support or missing local Llama-3.2 model weights, it falls back to a high-fidelity local rule-based simulation.
* **Simulated AI Outputs**:
  * **Match Win Probabilities**: Generates win percentages based on team name string lengths (e.g., `Home: 45%`, `Away: 35%`, `Draw: 20%`).
  * **Player Performance Ratings**: Generates a decimal rating ranging from `6.5` to `9.4` based on player name length and matching outcomes.
  * **Tactical Coaching Tips**: Evaluates the match event history and scorelines to generate tactical coach inputs:
    * *Lead Score*: `"Solid defensive structure. Control the tempo in midfield."`
    * *Trailing Score*: `"Increase vertical passing in transition. Exploit spacing behind opposition line."`
    * *High Cards*: `"High fouls logged. Avoid risky challenges in defensive third."`
    * *Equal Score / Default*: `"Increase tempo in final third. Work the half spaces."`

---

## 3. P2P Swarm Fallback Proxy (Pears Stack)
* **Location**: [p2p-client.ts](file:///home/lviffy/Projects/PitchOS/packages/sync-adapter/src/p2p-client.ts)
* **Description**:
  When running outside the native Pear runtime, direct Hyperswarm DHT discovery is unavailable. The `sync-adapter` establishes a connection to a local WebSocket relay service (`ws://localhost:3001`) which replicates database logs across browser tabs/devices using a shared memory pub/sub model.

---

## 4. Admin Dashboard Metrics & Telemetry
* **Location**: [AdminDashboard.tsx](file:///home/lviffy/Projects/PitchOS/apps/client/src/features/admin/AdminDashboard.tsx)
* **Simulated Telemetry Metrics**:
  If the Supporting Services API (next-app on port `3002`) is offline, the Admin dashboard falls back to displaying offline demo metrics:
  ```json
  {
    "status": "demo_mode_offline",
    "metrics": {
      "activeChallenges": 0,
      "cachedTournaments": 4,
      "pushSubscriptions": 2,
      "telemetryEvents": 12
    }
  }
  ```
* **Live Service Logs (Active)**:
  The Admin Dashboard log viewer retrieves the 20 most recent system events directly from the PostgreSQL database via `GET /api/telemetry`.
  * Real events are tracked and inserted whenever users schedule a match, start a match, record match details, or finalize matches.
  * If the database is clean or the Supporting Services API is currently offline, the dashboard gracefully falls back to a simulated telemetry log generator.
