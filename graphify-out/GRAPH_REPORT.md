# Graph Report - .  (2026-07-05)

## Corpus Check
- 42 files · ~38,448 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 644 nodes · 955 edges · 44 communities (36 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.9)
- Token cost: 1,200 input · 1,200 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Client App Pages & AI Coach UI|Client App Pages & AI Coach UI]]
- [[_COMMUNITY_PitchOS Project Architecture Specification|PitchOS Project Architecture Specification]]
- [[_COMMUNITY_PitchOS Product Requirements Document|PitchOS Product Requirements Document]]
- [[_COMMUNITY_Client App Package Dependencies|Client App Package Dependencies]]
- [[_COMMUNITY_PitchOS Mock & Fallback Services|PitchOS Mock & Fallback Services]]
- [[_COMMUNITY_Next-App Supporting Services Config|Next-App Supporting Services Config]]
- [[_COMMUNITY_Task Backlog & Backlog Overview|Task Backlog & Backlog Overview]]
- [[_COMMUNITY_Client Typescript Config|Client Typescript Config]]
- [[_COMMUNITY_shadcn Component Registry Config|shadcn Component Registry Config]]
- [[_COMMUNITY_Next-App Typescript Config|Next-App Typescript Config]]
- [[_COMMUNITY_UI Core Components (Badge, Button, Card)|UI Core Components (Badge, Button, Card)]]
- [[_COMMUNITY_Relay-Service Typescript Config|Relay-Service Typescript Config]]
- [[_COMMUNITY_API Authentication Routes|API Authentication Routes]]
- [[_COMMUNITY_P2P Sync Adapter Dependencies|P2P Sync Adapter Dependencies]]
- [[_COMMUNITY_Dependency Cruiser Analysis Tool|Dependency Cruiser Analysis Tool]]
- [[_COMMUNITY_P2P Network Core Dependencies|P2P Network Core Dependencies]]
- [[_COMMUNITY_PitchOS Project Workspace Guide|PitchOS Project Workspace Guide]]
- [[_COMMUNITY_Wallet Adapter Dependencies|Wallet Adapter Dependencies]]
- [[_COMMUNITY_Challenge Telemetry & Admin API|Challenge Telemetry & Admin API]]
- [[_COMMUNITY_Shared Types Package Setup|Shared Types Package Setup]]
- [[_COMMUNITY_Anti-Slop Frontend Design Taste Skill|Anti-Slop Frontend Design Taste Skill]]
- [[_COMMUNITY_Wallet Adapter Typescript Config|Wallet Adapter Typescript Config]]
- [[_COMMUNITY_Sync Adapter Typescript Config|Sync Adapter Typescript Config]]
- [[_COMMUNITY_Self-Custodial Wallet SDK Methods|Self-Custodial Wallet SDK Methods]]
- [[_COMMUNITY_Shared Types Typescript Config|Shared Types Typescript Config]]
- [[_COMMUNITY_Workspace Root Typescript Config|Workspace Root Typescript Config]]
- [[_COMMUNITY_Client Root Layout Config|Client Root Layout Config]]
- [[_COMMUNITY_Next-App Root Layout Config|Next-App Root Layout Config]]
- [[_COMMUNITY_Relay WebSocket Server Core|Relay WebSocket Server Core]]
- [[_COMMUNITY_Push Notification Storage Services|Push Notification Storage Services]]
- [[_COMMUNITY_Client ESLint Configuration|Client ESLint Configuration]]
- [[_COMMUNITY_Client Next.js Configuration|Client Next.js Configuration]]
- [[_COMMUNITY_Client PostCSS Configuration|Client PostCSS Configuration]]
- [[_COMMUNITY_Next-App ESLint Configuration|Next-App ESLint Configuration]]
- [[_COMMUNITY_Next-App Next.js Configuration|Next-App Next.js Configuration]]
- [[_COMMUNITY_Next-App PostCSS Configuration|Next-App PostCSS Configuration]]
- [[_COMMUNITY_Tournament Data Store Service|Tournament Data Store Service]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `compilerOptions` - 16 edges
3. `compilerOptions` - 16 edges
4. `db` - 13 edges
5. `cn()` - 13 edges
6. `query()` - 12 edges
7. `HypercoreMock` - 12 edges
8. `P2PClient` - 10 edges
9. `PitchOSDatabase` - 9 edges
10. `scripts` - 9 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `generateChallenge()`  [INFERRED]
  apps/next-app/src/app/api/auth/challenge/route.ts → packages/shared-types/src/auth.ts
- `POST()` --calls--> `verifyAuthResponse()`  [INFERRED]
  apps/next-app/src/app/api/auth/verify/route.ts → packages/shared-types/src/auth.ts
- `createTransaction()` --calls--> `signMessage()`  [EXTRACTED]
  apps/client/src/features/wallet/wallet-store.ts → packages/wallet-adapter/src/index.ts
- `createNewWallet()` --calls--> `generateWalletKeyPair()`  [EXTRACTED]
  apps/client/src/features/wallet/wallet-store.ts → packages/wallet-adapter/src/index.ts
- `WalletState` --inherits--> `WalletKeyPair`  [EXTRACTED]
  apps/client/src/features/wallet/wallet-store.ts → packages/wallet-adapter/src/index.ts

## Import Cycles
- 1-file cycle: `apps/client/src/components/ui/button.tsx -> apps/client/src/components/ui/button.tsx`

## Communities (44 total, 8 thin omitted)

### Community 0 - "Client App Pages & AI Coach UI"
Cohesion: 0.06
Nodes (58): DashboardTab, AIResponse, generateAICoachResponse(), generateMatchPostAnalysis(), generatePredictionRationale(), generateWeeklyPlayerReport(), getOrLoadModel(), initQvac() (+50 more)

### Community 1 - "PitchOS Project Architecture Specification"
Cohesion: 0.07
Nodes (60): PitchOS_Architecture.md, 10.1 MVP (Hackathon Deadline: July 8), 10.2 Phase 2 (July 12), 10.3 Final Phase (July 14) / Post-Hackathon, 10.4 Risks and Mitigations (Architecture-Specific), 10. Roadmap and Phased Implementation, 11.1 Glossary, 11.2 References (+52 more)

### Community 2 - "PitchOS Product Requirements Document"
Cohesion: 0.07
Nodes (54): PitchOS_PRD.md, 10. Phase 2 (Target: July 12), 11. Final Phase (Target: July 14), 12.1 Post-Hackathon KPIs (Directional), 12. Success Metrics, 13. Risks and Mitigations, 14. Why PitchOS Can Win, 15. Elevator Pitch (+46 more)

### Community 3 - "Client App Package Dependencies"
Cohesion: 0.06
Nodes (35): dependencies, @base-ui/react, class-variance-authority, clsx, dexie, lucide-react, next, @phosphor-icons/react (+27 more)

### Community 4 - "PitchOS Mock & Fallback Services"
Cohesion: 0.09
Nodes (11): Admin Dashboard Telemetry Fallback, P2P Swarm Fallback Proxy, Local AI Coach Fallback, Self-Custodial Wallet Mock, AutobaseMock, HypercoreMock, initRealPearsStack(), LogEntry (+3 more)

### Community 5 - "Next-App Supporting Services Config"
Cohesion: 0.08
Nodes (25): dependencies, next, pg, @pitchos/shared-types, react, react-dom, @types/pg, devDependencies (+17 more)

### Community 6 - "Task Backlog & Backlog Overview"
Cohesion: 0.13
Nodes (26): task.md, 1. Project Overview, 2. Corrected Timeline, 3. Global Risk Register, 4. Cross-Phase Dependency Chain, 5. Example Task Format (for backlog grooming), 6. Final Deliverables Checklist, Final Phase (July 14) (+18 more)

### Community 7 - "Client Typescript Config"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+14 more)

### Community 8 - "shadcn Component Registry Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 9 - "Next-App Typescript Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+13 more)

### Community 10 - "UI Core Components (Badge, Button, Card)"
Cohesion: 0.21
Nodes (15): Badge(), badgeVariants, Button(), buttonVariants, Card(), CardAction(), CardContent(), CardDescription() (+7 more)

### Community 11 - "Relay-Service Typescript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 12 - "API Authentication Routes"
Cohesion: 0.20
Nodes (12): ALLOWED_IPS, GET(), POST(), verifyToken(), GET(), POST(), GET(), POST() (+4 more)

### Community 13 - "P2P Sync Adapter Dependencies"
Cohesion: 0.11
Nodes (17): dependencies, @pitchos/shared-types, ws, devDependencies, ts-node, @types/node, @types/ws, typescript (+9 more)

### Community 14 - "Dependency Cruiser Analysis Tool"
Cohesion: 0.11
Nodes (16): devDependencies, dependency-cruiser, typescript, name, private, scripts, build, depcruise (+8 more)

### Community 15 - "P2P Network Core Dependencies"
Cohesion: 0.12
Nodes (15): dependencies, autobase, hypercore, hyperswarm, @pitchos/shared-types, devDependencies, typescript, main (+7 more)

### Community 16 - "PitchOS Project Workspace Guide"
Cohesion: 0.25
Nodes (14): README.md, 1. Project Architecture, 2. Quick Start, 3. Step-by-Step Judging Validation Script (100% Offline Capable), 4. Workspaces & Structure, Boot Dev Environment, Install dependencies, PitchOS — AI-Powered Decentralized Football Operating System (+6 more)

### Community 17 - "Wallet Adapter Dependencies"
Cohesion: 0.14
Nodes (13): dependencies, @pitchos/shared-types, @tetherto/wdk, devDependencies, typescript, main, name, private (+5 more)

### Community 18 - "Challenge Telemetry & Admin API"
Cohesion: 0.22
Nodes (9): GET(), challenges, POST(), signToken(), generateChallenge(), verifyAuthResponse(), verifySignature(), DIDAuthResponse (+1 more)

### Community 19 - "Shared Types Package Setup"
Cohesion: 0.17
Nodes (11): dependencies, devDependencies, typescript, main, name, private, scripts, build (+3 more)

### Community 20 - "Anti-Slop Frontend Design Taste Skill"
Cohesion: 0.25
Nodes (8): design-taste-frontend SKILL.md, Brief Inference, Copy & Content Density Audit, Default React & CSS Architecture, Design System Mapping, Image & Visual Asset Strategy, Layout & Aesthetic Discipline, The Three Dials

### Community 21 - "Wallet Adapter Typescript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, noEmit, outDir, rootDir, extends, include

### Community 22 - "Sync Adapter Typescript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, noEmit, outDir, rootDir, extends, include

### Community 23 - "Self-Custodial Wallet SDK Methods"
Cohesion: 0.43
Nodes (7): bufToHex(), FALLBACK_WORDS, generateFallbackMnemonic(), generateWalletKeyPair(), getWDKClass(), hexToBuf(), signMessage()

### Community 24 - "Shared Types Typescript Config"
Cohesion: 0.25
Nodes (7): compilerOptions, declaration, noEmit, outDir, rootDir, extends, include

### Community 25 - "Workspace Root Typescript Config"
Cohesion: 0.29
Nodes (6): compilerOptions, noEmit, outDir, rootDir, extends, include

### Community 26 - "Client Root Layout Config"
Cohesion: 0.40
Nodes (3): geistMono, inter, metadata

### Community 27 - "Next-App Root Layout Config"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 28 - "Relay WebSocket Server Core"
Cohesion: 0.40
Nodes (4): ClientSession, server, sessions, wss

## Knowledge Gaps
- **253 isolated node(s):** `eslintConfig`, `config`, `ClubViewProps`, `target`, `lib` (+248 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `HypercoreMock` connect `PitchOS Mock & Fallback Services` to `Client App Pages & AI Coach UI`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `P2PClient` connect `PitchOS Mock & Fallback Services` to `Client App Pages & AI Coach UI`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `DIDChallenge` connect `Challenge Telemetry & Admin API` to `Client App Pages & AI Coach UI`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `config`, `ClubViewProps` to the rest of the system?**
  _253 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Client App Pages & AI Coach UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05787545787545788 - nodes in this community are weakly interconnected._
- **Should `PitchOS Project Architecture Specification` be split into smaller, more focused modules?**
  _Cohesion score 0.06610169491525424 - nodes in this community are weakly interconnected._
- **Should `PitchOS Product Requirements Document` be split into smaller, more focused modules?**
  _Cohesion score 0.07337526205450734 - nodes in this community are weakly interconnected._