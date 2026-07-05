# Graph Report - .  (2026-07-05)

## Corpus Check
- Corpus is ~32,484 words - fits in a single context window. You may not need a graph.

## Summary
- 540 nodes · 799 edges · 34 communities (28 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Self-Custodial Wallet|Self-Custodial Wallet]]
- [[_COMMUNITY_Self-Custodial Wallet|Self-Custodial Wallet]]
- [[_COMMUNITY_Self-Custodial Wallet|Self-Custodial Wallet]]
- [[_COMMUNITY_Tournament Brackets|Tournament Brackets]]
- [[_COMMUNITY_Self-Custodial Wallet|Self-Custodial Wallet]]
- [[_COMMUNITY_Self-Custodial Wallet|Self-Custodial Wallet]]
- [[_COMMUNITY_QVAC AI Coach|QVAC AI Coach]]
- [[_COMMUNITY_Self-Custodial Wallet|Self-Custodial Wallet]]
- [[_COMMUNITY_Self-Custodial Wallet|Self-Custodial Wallet]]
- [[_COMMUNITY_P2P Synchronization|P2P Synchronization]]
- [[_COMMUNITY_Module tsconfig.json|Module: tsconfig.json]]
- [[_COMMUNITY_QVAC AI Coach|QVAC AI Coach]]
- [[_COMMUNITY_WebSocket Relay Service|WebSocket Relay Service]]
- [[_COMMUNITY_Self-Custodial Wallet|Self-Custodial Wallet]]
- [[_COMMUNITY_Self-Custodial Wallet|Self-Custodial Wallet]]
- [[_COMMUNITY_QVAC AI Coach|QVAC AI Coach]]
- [[_COMMUNITY_QVAC AI Coach|QVAC AI Coach]]
- [[_COMMUNITY_QVAC AI Coach|QVAC AI Coach]]
- [[_COMMUNITY_Module tsconfig.json|Module: tsconfig.json]]
- [[_COMMUNITY_Module tsconfig.json|Module: tsconfig.json]]
- [[_COMMUNITY_Module tsconfig.json|Module: tsconfig.json]]
- [[_COMMUNITY_Module tsconfig.json|Module: tsconfig.json]]
- [[_COMMUNITY_Module layout.tsx|Module: layout.tsx]]
- [[_COMMUNITY_Module layout.tsx|Module: layout.tsx]]
- [[_COMMUNITY_Module index.ts|Module: index.ts]]
- [[_COMMUNITY_Module eslint.config.mjs|Module: eslint.config.mjs]]
- [[_COMMUNITY_Module next.config.ts|Module: next.config.ts]]
- [[_COMMUNITY_Module postcss.config.mjs|Module: postcss.config.mjs]]
- [[_COMMUNITY_Module eslint.config.mjs|Module: eslint.config.mjs]]
- [[_COMMUNITY_Module next.config.ts|Module: next.config.ts]]
- [[_COMMUNITY_Module postcss.config.mjs|Module: postcss.config.mjs]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `compilerOptions` - 16 edges
3. `compilerOptions` - 16 edges
4. `db` - 11 edges
5. `HypercoreMock` - 11 edges
6. `scripts` - 9 edges
7. `RosterEntry` - 9 edges
8. `Match` - 9 edges
9. `P2PClient` - 9 edges
10. `PitchOSDatabase` - 8 edges

## Surprising Connections (you probably didn't know these)
- `registerTeamInTournament()` --calls--> `signMessage()`  [EXTRACTED]
  apps/client/src/features/tournament/tournament-store.ts → packages/wallet-adapter/src/index.ts
- `GET()` --calls--> `generateChallenge()`  [INFERRED]
  apps/next-app/src/app/api/auth/challenge/route.ts → packages/shared-types/src/auth.ts
- `POST()` --calls--> `verifyAuthResponse()`  [INFERRED]
  apps/next-app/src/app/api/auth/verify/route.ts → packages/shared-types/src/auth.ts
- `WalletState` --inherits--> `WalletKeyPair`  [EXTRACTED]
  apps/client/src/features/wallet/wallet-store.ts → packages/wallet-adapter/src/index.ts
- `createNewWallet()` --calls--> `generateWalletKeyPair()`  [EXTRACTED]
  apps/client/src/features/wallet/wallet-store.ts → packages/wallet-adapter/src/index.ts

## Import Cycles
- None detected.

## Communities (34 total, 6 thin omitted)

### Community 0 - "Self-Custodial Wallet"
Cohesion: 0.08
Nodes (48): AIResponse, delay(), generateAICoachResponse(), generateMatchPostAnalysis(), generatePredictionRationale(), generateWeeklyPlayerReport(), MatchAnalysis, PredictionRationale (+40 more)

### Community 1 - "Self-Custodial Wallet"
Cohesion: 0.07
Nodes (60): PitchOS_Architecture.md, 10.1 MVP (Hackathon Deadline: July 8), 10.2 Phase 2 (July 12), 10.3 Final Phase (July 14) / Post-Hackathon, 10.4 Risks and Mitigations (Architecture-Specific), 10. Roadmap and Phased Implementation, 11.1 Glossary, 11.2 References (+52 more)

### Community 2 - "Self-Custodial Wallet"
Cohesion: 0.07
Nodes (54): PitchOS_PRD.md, 10. Phase 2 (Target: July 12), 11. Final Phase (Target: July 14), 12.1 Post-Hackathon KPIs (Directional), 12. Success Metrics, 13. Risks and Mitigations, 14. Why PitchOS Can Win, 15. Elevator Pitch (+46 more)

### Community 3 - "Tournament Brackets"
Cohesion: 0.11
Nodes (17): ALLOWED_IPS, GET(), challenges, POST(), signToken(), PushSubscriptionData, pushSubscriptions, POST() (+9 more)

### Community 4 - "Self-Custodial Wallet"
Cohesion: 0.07
Nodes (26): dependencies, dexie, next, @pitchos/shared-types, @pitchos/sync-adapter, @pitchos/wallet-adapter, react, react-dom (+18 more)

### Community 5 - "Self-Custodial Wallet"
Cohesion: 0.13
Nodes (26): task.md, 1. Project Overview, 2. Corrected Timeline, 3. Global Risk Register, 4. Cross-Phase Dependency Chain, 5. Example Task Format (for backlog grooming), 6. Final Deliverables Checklist, Final Phase (July 14) (+18 more)

### Community 6 - "QVAC AI Coach"
Cohesion: 0.08
Nodes (23): dependencies, next, @pitchos/shared-types, react, react-dom, devDependencies, eslint, eslint-config-next (+15 more)

### Community 7 - "Self-Custodial Wallet"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+14 more)

### Community 8 - "Self-Custodial Wallet"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+13 more)

### Community 9 - "P2P Synchronization"
Cohesion: 0.11
Nodes (5): AutobaseMock, HypercoreMock, LogEntry, SyncCallback, P2PClient

### Community 10 - "Module: tsconfig.json"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "QVAC AI Coach"
Cohesion: 0.11
Nodes (17): dependencies, @pitchos/shared-types, ws, devDependencies, ts-node, @types/node, @types/ws, typescript (+9 more)

### Community 12 - "WebSocket Relay Service"
Cohesion: 0.11
Nodes (16): devDependencies, dependency-cruiser, typescript, name, private, scripts, build, depcruise (+8 more)

### Community 13 - "Self-Custodial Wallet"
Cohesion: 0.21
Nodes (11): DashboardTab, PredictionView(), createNewWallet(), deleteLocalWallet(), WalletState, WalletSetupProps, bufToHex(), generateWalletKeyPair() (+3 more)

### Community 14 - "Self-Custodial Wallet"
Cohesion: 0.25
Nodes (14): README.md, 1. Project Architecture, 2. Quick Start, 3. Step-by-Step Judging Validation Script (100% Offline Capable), 4. Workspaces & Structure, Boot Dev Environment, Install dependencies, PitchOS — AI-Powered Decentralized Football Operating System (+6 more)

### Community 15 - "QVAC AI Coach"
Cohesion: 0.15
Nodes (12): dependencies, @pitchos/shared-types, devDependencies, typescript, main, name, private, scripts (+4 more)

### Community 16 - "QVAC AI Coach"
Cohesion: 0.15
Nodes (12): dependencies, @pitchos/shared-types, devDependencies, typescript, main, name, private, scripts (+4 more)

### Community 17 - "QVAC AI Coach"
Cohesion: 0.17
Nodes (11): dependencies, devDependencies, typescript, main, name, private, scripts, build (+3 more)

### Community 18 - "Module: tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, noEmit, outDir, rootDir, extends, include

### Community 19 - "Module: tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, noEmit, outDir, rootDir, extends, include

### Community 20 - "Module: tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, noEmit, outDir, rootDir, extends, include

### Community 21 - "Module: tsconfig.json"
Cohesion: 0.29
Nodes (6): compilerOptions, noEmit, outDir, rootDir, extends, include

### Community 22 - "Module: layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 23 - "Module: layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 24 - "Module: index.ts"
Cohesion: 0.40
Nodes (4): ClientSession, server, sessions, wss

## Knowledge Gaps
- **204 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Self-Custodial Wallet` be split into smaller, more focused modules?**
  _Cohesion score 0.07550482879719052 - nodes in this community are weakly interconnected._
- **Should `Self-Custodial Wallet` be split into smaller, more focused modules?**
  _Cohesion score 0.06610169491525424 - nodes in this community are weakly interconnected._
- **Should `Self-Custodial Wallet` be split into smaller, more focused modules?**
  _Cohesion score 0.07337526205450734 - nodes in this community are weakly interconnected._
- **Should `Tournament Brackets` be split into smaller, more focused modules?**
  _Cohesion score 0.10582010582010581 - nodes in this community are weakly interconnected._
- **Should `Self-Custodial Wallet` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Self-Custodial Wallet` be split into smaller, more focused modules?**
  _Cohesion score 0.12615384615384614 - nodes in this community are weakly interconnected._