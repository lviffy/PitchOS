# task.md

# PitchOS — Development Execution Plan

Version: 2.0 (Corrected)
Project: PitchOS — AI-Powered Decentralized Football Operating System
Hackathon: Tether Developers Cup 2026
Duration: **3-Day MVP Sprint (July 5 → July 8) + Phase 2 (→ July 12) + Final Phase (→ July 14)**
Methodology: Agile (Daily milestones)
Status: Active
Aligned to: PitchOS PRD v2.0, PitchOS Architecture v2.1

> **Fix note:** v1.0 of this plan assumed a generic 2-week timeline and a generic Pear/Autobase-only stack. Corrected to match the PRD's actual MVP deadline (July 8 — 3 days from today) and the Architecture doc's real stack: Next.js (Client-Local Core + Supporting Services), QVAC (on-device AI), Pears/Hypercore/Autobase/Hyperswarm (P2P), WDK (self-custodial wallet), a standalone Relay/Rendezvous service, and Supabase (non-authoritative Supporting Services only).

---

# 1. Project Overview

## Objective

Build an offline-first, decentralized football operating system so grassroots clubs can manage teams, tournaments, live matches, AI coaching, prediction pools, and payments — with **zero centralized backend required for core operation**. Every core flow must run entirely offline on a local network for the judged demo.

## Two-Layer Architecture (build both, in this priority order)

1. **Client-Local Core** (priority — this is the product): Next.js UI/PWA, QVAC AI runtime, Hypercore/Autobase log, IndexedDB, WDK wallet. No authoritative server for club/player/match/wallet data.
2. **Supporting Services** (thin, non-authoritative, MVP-minimal): standalone Relay/Rendezvous service (Node + WebSocket) for NAT traversal only. The full Next.js Supporting Services app (Public Gateway, Notifications, Telemetry, Admin) + Supabase is **deferred to Phase 2/Final** per the Architecture doc's own roadmap (Section 10).

## Success Criteria

### Technical (from PRD Section 12)
- Club creation < 2 minutes
- Peer sync latency (local network) < 1 second
- AI coaching response < 5 seconds
- Wallet setup < 1 minute
- Tournament creation < 3 minutes
- 100% of core features demoed with no internet (airplane mode)

### Product
- Full lifecycle demo: create club → roster → live match sync → AI coaching → tournament bracket → wallet → entry fee → prediction pool → payout
- Judges can independently verify QVAC, Pears, and WDK usage — not superficial integration
- Stable, rehearsed, offline demo with a recorded backup

## Key Stakeholders / Roles

| Role | Responsibility |
|---|---|
| Product Lead | Scope gate, demo script, judging narrative |
| Technical/Architecture Lead | Client-Local Core structure, module boundaries |
| Frontend Engineer | Next.js UI/PWA, dashboards, Live Match Center |
| Backend Engineer | IndexedDB schema, Hypercore log design, Relay integration |
| P2P Engineer | Hyperswarm, Hypercore, Autobase, Relay service |
| AI Engineer | QVAC integration — Coach, Analysis, Commentary, Translation, Prediction |
| Blockchain Engineer | WDK wallet, entry fees, escrow, prize distribution |
| QA / Demo Lead | Offline test rig, rehearsal, backup recording |
| Designer | Shared component library / design system |

---

# 2. Corrected Timeline

Today: **July 5, 2026**

```
July 5        Phase 0 — Setup & Client-Local Core Skeleton
  ↓
July 6        Phase 1 — Club/Team/Player + P2P Sync + Wallet Boot
  ↓
July 7        Phase 2 — Match Center, Tournament, AI Coach, Prediction Circles
  ↓
July 8        Phase 3 — Integration, Offline Rehearsal → MVP SUBMISSION
─────────────────────────────────────────────────────────────
July 9–12     Phase 4 — Video analysis, commentary, donations, translation,
               Public Gateway + Notifications (Next.js Supporting Services
               app stood up per Architecture §10.2) → PHASE 2 SUBMISSION
─────────────────────────────────────────────────────────────
July 13–14    Phase 5 — Admin tooling, full observability, security review,
               polish, rehearsed demo → FINAL SUBMISSION
```

This directly mirrors PRD §9–11 (MVP/Phase 2/Final Phase scope) and Architecture §10 (Roadmap and Phased Implementation) — the two source docs were already aligned with each other; the original task.md just wasn't aligned with either.

---

# 3. Global Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| On-device AI (QVAC) too slow on mid-range Android | Medium | High | Quantized models; heuristic fallback for low-end devices |
| Hyperswarm/DHT unreliable across judge networks | Medium | Critical | Build & test Relay service first; rehearse on multiple real networks, not just localhost |
| Multi-writer sync conflicts (simultaneous match logging) | Medium | High | Autobase causal ordering + deterministic per-data-type conflict rules |
| WDK wallet integration delays | Medium | Medium | Mock wallet adapter first, swap to real WDK once wired |
| Real-money prediction pools raise legal exposure | Medium | High | Points-only mode default; real-money strictly opt-in with disclaimers (ADR-007) |
| Minors' data privacy | Medium | Legal/trust risk | On-device-only AI processing, parent-controlled fields, role-scoped access |
| Scope creep across 15+ PRD features in a 3-day MVP window | High | Critical | Hard scope gate = PRD §9 list only for MVP; everything else deferred |
| Judges can't verify "offline" claim live | Medium | Critical | Demo script with visible airplane-mode toggle at each key step |
| Supporting Services becomes accidental source of truth | Low | High | Code review checklist + ADR-003 enforcement: Supabase/Next.js backend never authoritative |

---

# PHASE 0 — Setup & Client-Local Core Skeleton

**Duration:** July 5 (Day 1)
**Milestone:** Client-Local Core builds, deploys, and runs — no features yet, but the real architecture (not a generic starter) is in place.

## Tasks

| ID | Task | Owner | Estimate | Dependency |
|---|---|---|---|---|
| P0-1 | Repo setup (monorepo: client app + relay service + shared-types package) | Tech Lead | 30 min | None |
| P0-2 | Next.js project (App Router, PWA config) | Frontend | 1 hr | P0-1 |
| P0-3 | Tailwind + design tokens | Frontend | 30 min | P0-2 |
| P0-4 | TypeScript strict config, shared-types package | Frontend | 30 min | P0-2 |
| P0-5 | ESLint + dependency-cruiser (enforce folder-by-domain, per ADR-002) | Frontend | 30 min | P0-2 |
| P0-6 | CI/CD (build + lint on push) | DevOps | 1 hr | P0-1 |
| P0-7 | IndexedDB wrapper + local storage architecture | Backend | 1.5 hr | P0-2 |
| P0-8 | Hypercore install + basic append-only log spike | P2P Engineer | 2 hr | P0-1 |
| P0-9 | Relay service skeleton (Node + WebSocket, stateless-per-connection) | P2P Engineer | 2 hr | P0-1 |
| P0-10 | DID-based auth utility (shared across client + relay, per ADR-004) | Backend | 2 hr | P0-4 |

**Definition of Done:** App builds and deploys; DID auth works locally; a Hypercore log can be created and read; Relay service boots and accepts a WebSocket connection.

**Deliverables:** Project skeleton, CI pipeline, IndexedDB layer, Hypercore spike, Relay skeleton.

---

# PHASE 1 — Club Management + P2P Sync + Wallet Boot

**Duration:** July 6 (Day 2)
**Milestone:** Two devices can create/join a club and see the same roster sync live; a wallet exists per user.

## Tasks

| ID | Task | Owner | Estimate | Dependency |
|---|---|---|---|---|
| F1-1 | Club creation (name, crest, location, age category) | Frontend + Backend | 2 hr | Phase 0 |
| F1-2 | Role-based access (Owner/Admin/Coach/Player/Parent/Volunteer) | Backend | 2 hr | F1-1 |
| F1-3 | Shareable code / QR invite (offline via Hyperswarm discovery) | P2P Engineer | 3 hr | F1-1, P0-8 |
| F1-4 | Team roster + player profiles (minors → parent-controlled fields) | Frontend | 3 hr | F1-2 |
| F1-5 | Attendance tracking (training + match) | Frontend + Backend | 2 hr | F1-4 |
| F1-6 | Hyperswarm peer discovery wired to club log | P2P Engineer | 3 hr | P0-8, F1-1 |
| F1-7 | Autobase multi-writer merge (roster edits from 2+ coaches) | P2P Engineer | 4 hr | F1-6 |
| F1-8 | Live sync validation across 2 physical devices | QA | 2 hr | F1-7 |
| F1-9 | WDK wallet creation + key generation (client-side only) | Blockchain Engineer | 3 hr | Phase 0 |
| F1-10 | Wallet onboarding UI (<1 min target) | Frontend | 1.5 hr | F1-9 |

**Definition of Done:** Club created in <2 min; roster edits on Device A appear on Device B in <1 sec on local network with no internet; wallet created in <1 min.

**Deliverables:** Club/team/player management, working P2P roster sync, functional wallet.

---

# PHASE 2 — Match Center, Tournament, AI Coach, Prediction Circles

**Duration:** July 7 (Day 3)
**Milestone:** A full match can be played, an AI coaching response returned, and a points-mode prediction pool settled — all offline.

## Tasks

| ID | Task | Owner | Estimate | Dependency |
|---|---|---|---|---|
| F2-1 | Live Match Center (goals, cards, substitutions, timeline) | Frontend | 6 hr | F1-7 |
| F2-2 | Match event replication over Autobase | P2P Engineer | 3 hr | F1-7, F2-1 |
| F2-3 | Tournament creation + single-format (knockout) bracket | Frontend + Backend | 4 hr | F1-1 |
| F2-4 | Fixtures + leaderboards | Frontend | 3 hr | F2-3 |
| F2-5 | QVAC integration — on-device model load + inference pipeline | AI Engineer | 4 hr | Phase 0 |
| F2-6 | AI Coach UI (text Q&A + basic feedback, <5 sec response) | Frontend + AI Engineer | 3 hr | F2-5 |
| F2-7 | Entry-fee payment flow (WDK, direct wallet-to-wallet) | Blockchain Engineer | 3 hr | F1-9, F2-3 |
| F2-8 | Prediction circle — points-mode only, default real-money OFF (ADR-007) | Blockchain + Backend | 4 hr | F2-7 |
| F2-9 | AI prediction rationale/explanation via QVAC | AI Engineer | 2 hr | F2-5, F2-8 |
| F2-10 | Escrow + automatic points payout on match result | Blockchain Engineer | 3 hr | F2-8, F2-2 |

**Definition of Done:** Match is playable and syncs live; AI Coach responds in <5 sec fully on-device; tournament bracket advances correctly; a prediction pool can be joined, paid into (points), and paid out.

**Deliverables:** Match Center, Tournament system, AI Coach, Prediction circles (points mode).

---

# PHASE 3 — Integration, Offline Rehearsal, MVP Submission

**Duration:** July 8 (Day 3, cont'd → deadline)
**Milestone:** MVP scope (PRD §9) fully integrated and demo-rehearsed offline.

## Tasks

| ID | Task | Owner | Estimate | Dependency |
|---|---|---|---|---|
| P3-1 | End-to-end integration pass across all Phase 1–2 modules | Tech Lead | 3 hr | Phase 2 |
| P3-2 | Airplane-mode test rig — verify 100% of MVP features work offline | QA | 3 hr | P3-1 |
| P3-3 | Relay service deployed single-region (Fly.io) as sync fallback only | P2P Engineer | 2 hr | P0-9 |
| P3-4 | Bug bash + fix blockers | All | 4 hr | P3-2 |
| P3-5 | Demo script written with explicit airplane-mode toggle points | Demo Lead | 2 hr | P3-2 |
| P3-6 | Demo rehearsal + recorded backup video | Demo Lead + All | 2 hr | P3-5 |
| P3-7 | README + architecture note for judges (map features → QVAC/Pears/WDK) | Product Lead | 1.5 hr | P3-1 |
| P3-8 | Final deploy + submission | Tech Lead | 1 hr | P3-6 |

**Definition of Done (MVP Exit Criteria, per PRD §9):**
- [ ] Club creation works
- [ ] Players can join teams
- [ ] Live matches sync across devices, offline
- [ ] AI Coach runs locally
- [ ] Tournament bracket functions
- [ ] Wallets operational
- [ ] Prediction pools work in points mode
- [ ] Offline functionality demonstrated successfully
- [ ] End-to-end demo completes without manual intervention

**Deliverables:** MVP build, demo video, GitHub repo, judge-facing README.

---

# PHASE 4 — Supporting Services Stand-Up + Enhanced Features

**Duration:** July 9–12
**Milestone:** Next.js Supporting Services app exists (non-authoritative); richer AI and engagement features land.

## Tasks

| ID | Task | Owner | Estimate | Dependency |
|---|---|---|---|---|
| P4-1 | Stand up Next.js Supporting Services app (folder-by-domain, per ADR-002) | Backend | 4 hr | MVP submitted |
| P4-2 | Public Gateway module — shareable tournament pages, SEO | Backend + Frontend | 4 hr | P4-1 |
| P4-3 | Notifications module | Backend | 3 hr | P4-1 |
| P4-4 | Second Relay region (US + 1 additional) | P2P Engineer | 3 hr | P3-3 |
| P4-5 | Video-based match analysis (QVAC) | AI Engineer | 6 hr | F2-5 |
| P4-6 | Live AI commentary | AI Engineer | 4 hr | F2-5 |
| P4-7 | Multilingual translation (AI-mediated UGC only, per PRD non-goals) | AI Engineer | 3 hr | F2-5 |
| P4-8 | Fan leaderboards + donations (WDK) | Blockchain + Frontend | 4 hr | F2-7 |
| P4-9 | Merchandise payments | Blockchain Engineer | 3 hr | F2-7 |
| P4-10 | Additional prediction modes (correct score, total goals, BTTS) | Backend + Blockchain | 4 hr | F2-8 |
| P4-11 | Opt-in aggregate telemetry (schema-enforced, no PII/free-text fields) | Backend | 3 hr | P4-1 |
| P4-12 | Multi-writer conflict handling at scale (sync robustness) | P2P Engineer | 4 hr | F1-7 |

**Definition of Done:** Supabase-backed Supporting Services app live but holds no authoritative club/player/match/wallet data (ADR-003 verified in code review); enhanced features functional.

**Deliverables:** Public Gateway, Notifications, video analysis, commentary, translation, donations, merch payments, expanded prediction modes.

---

# PHASE 5 — Admin, Observability, Security, Final Polish

**Duration:** July 13–14
**Milestone:** Submission-ready final build.

## Tasks

| ID | Task | Owner | Estimate | Dependency |
|---|---|---|---|---|
| P5-1 | Admin route group (IP-allowlisted) | Backend | 3 hr | P4-1 |
| P5-2 | Full observability stack (Grafana/Loki/Tempo) in production | DevOps | 4 hr | P4-1 |
| P5-3 | Lightweight security review before enabling real-money pools by default for any organizer | Security/Tech Lead | 4 hr | P4-10 |
| P5-4 | Advanced dashboards (club-level + player-level analytics) | Frontend | 4 hr | P4-11 |
| P5-5 | Enhanced AI recommendations (weekly reports, weakness trend tracking) | AI Engineer | 3 hr | P4-5 |
| P5-6 | UI polish + animations + shared component consistency pass | Designer + Frontend | 4 hr | All prior |
| P5-7 | Responsive/cross-device testing | QA | 3 hr | P5-6 |
| P5-8 | Full end-to-end demo workflow rehearsed and timed | Demo Lead | 2 hr | P5-7 |
| P5-9 | Final documentation + submission package | Product Lead | 2 hr | P5-8 |
| P5-10 | Final deployment | Tech Lead | 1 hr | P5-9 |

**Definition of Done:** Zero blocker bugs; full lifecycle (registration → fixtures → live play → prediction pools → prize distribution) demoed end-to-end; documentation complete.

**Deliverables:** Final build, pitch deck, demo video, GitHub repository, submission package.

---

# 4. Cross-Phase Dependency Chain

```
Setup (Phase 0)
   ↓
Club/Roster + P2P Sync + Wallet (Phase 1)
   ↓
Match Center + Tournament + AI Coach + Prediction (Phase 2)
   ↓
Integration + Offline Rehearsal → MVP SUBMISSION (Phase 3, July 8)
   ↓
Supporting Services + Enhanced AI/Payments (Phase 4, → July 12)
   ↓
Admin + Observability + Security + Polish → FINAL SUBMISSION (Phase 5, → July 14)
```

---

# 5. Example Task Format (for backlog grooming)

## TASK-124

**Title:** Implement Live Match Timeline
**Owner:** Frontend Engineer
**Priority:** High
**Estimate:** 6 hours
**Dependencies:** Club/Roster model (F1-1–F1-4), Autobase sync (F1-7), Match model (F2-1)

**Acceptance Criteria**
- Timeline updates live across devices with no internet
- Cards, goals, substitutions supported
- Match events replicate via Autobase with deterministic conflict resolution

**Definition of Done**
- Code reviewed
- Tests passing
- Responsive
- Documentation updated
- Merged into main

---

# 6. Final Deliverables Checklist

## MVP (July 8)
- [ ] Repository, CI/CD, Relay skeleton
- [ ] Club, team, player management
- [ ] Hyperswarm/Hypercore/Autobase live sync (2+ devices)
- [ ] WDK wallet creation + entry-fee payments
- [ ] Live Match Center + single-format tournament bracket
- [ ] QVAC-powered AI Coach (<5 sec response)
- [ ] Points-mode prediction circles + AI rationale
- [ ] Offline demo rehearsed + recorded backup

## Phase 2 (July 12)
- [ ] Next.js Supporting Services app (Public Gateway, Notifications)
- [ ] Second Relay region
- [ ] Video match analysis, live commentary, translation
- [ ] Donations, merch payments
- [ ] Additional prediction modes
- [ ] Opt-in telemetry (schema-enforced)

## Final Phase (July 14)
- [ ] Admin route group
- [ ] Full observability stack
- [ ] Security review (gate for real-money pools)
- [ ] Advanced dashboards + AI weekly reports
- [ ] UI polish, responsive testing
- [ ] Rehearsed full-lifecycle demo, final submission
