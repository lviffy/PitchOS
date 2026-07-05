# PitchOS — Product Requirements Document (PRD)

## AI-Powered Decentralized Football Operating System

**Hackathon:** Tether Developers Cup 2026
**Document Owner:** [Team Lead Name]
**Version:** 2.0 (Expanded)
**Last Updated:** July 5, 2026

**Tracks**

* ✅ QVAC (Primary) — On-device AI inference
* ✅ Pears Stack (Primary) — Peer-to-peer sync
* ✅ WDK (Primary) — Self-custodial wallets & payments

---

## 1. Executive Summary

PitchOS is an offline-first, privacy-preserving operating system for grassroots football — clubs, academies, tournament organizers, coaches, players, and fans. It replaces a fragmented stack of WhatsApp, Google Sheets, Google Drive, cash handling, and centralized SaaS tools with a single application that runs AI locally, synchronizes data peer-to-peer, and settles payments through self-custodial wallets.

The product's core differentiator is that **every capability works with zero internet connectivity and zero centralized backend**. Data ownership, payment custody, and AI inference all remain on the user's device or within a local peer swarm. This is a foundational requirement — not an optimization — because the target users (grassroots clubs in low-connectivity regions) cannot rely on continuous internet access or trust third-party clouds with sensitive data such as minors' player statistics, video footage, and payment credentials.

This PRD defines the problem, users, requirements, technical architecture, phased scope, and success criteria for the hackathon build and the product's longer-term roadmap.

---

## 2. Problem Statement

### 2.1 Current State

Grassroots football organizations — the vast majority of the world's ~4 billion football-adjacent population — operate on a patchwork of disconnected, consumer-grade tools:

| Function | Current Tool | Pain Point |
|---|---|---|
| Communication | WhatsApp groups | No structure, lost history, no roles |
| Attendance / rosters | Google Sheets | Manual, error-prone, no offline sync |
| Registration fees | Cash / bank transfer | No transparency, no receipts, custody risk |
| Tournament brackets | Paper or spreadsheets | Manual updates, single point of failure |
| Player analysis | None, or expensive cloud scouting tools | Cost-prohibitive, exposes minors' data to third parties |
| Live scoring | Manual shouting / SMS chains | No historical record, unreliable |
| Prediction pools / side games | Informal, cash-based | No trust, no automated payout |

### 2.2 Why This Matters Now

* Football is the most-played sport globally, but tooling investment is concentrated at the professional and semi-professional tiers.
* Many grassroots communities are in regions with intermittent connectivity (rural areas, developing markets, stadiums with poor signal) where cloud-dependent apps fail exactly when needed most (matchday).
* Data privacy regulations increasingly restrict processing of minors' data (many players are under 18) — cloud AI and analytics tools create compliance risk that most clubs are unequipped to manage.
* Self-custodial payment rails (via WDK) now make it possible to handle registration fees, prize pools, and donations without a club treasurer holding cash or a third-party payment processor taking a cut and custody.

### 2.3 Consequences of Inaction

* Clubs lose institutional knowledge (rosters, match history) when a volunteer's phone breaks or a spreadsheet is deleted.
* Players — especially in underserved regions — lack access to the kind of technical/tactical feedback that wealthier academies buy from professional scouts.
* Prediction and fan-engagement activities remain informal, cash-based, and legally ambiguous, missing an opportunity to fund clubs transparently.

---

## 3. Solution Overview

PitchOS is a single cross-platform application (web-first via Next.js, packaged for desktop/mobile shells later) that integrates three pillars:

1. **Local AI (QVAC)** — all inference (coaching feedback, match analysis, tactical suggestions, commentary, translation, prediction rationale) runs on-device. No player data, video, or statistics leave the device for inference.
2. **Peer-to-peer sync (Pears / Hypercore / Autobase / Hyperswarm)** — club data, live match events, chat, and prediction circles replicate directly between devices on local networks or over the internet when available, with no central server of record.
3. **Self-custodial payments (WDK)** — every user holds their own wallet; membership fees, tournament entries, prize pools, and donations move directly between wallets under transparent, auditable logic.

The result: a club can be created, staffed, funded, and run through an entire season or tournament without any centralized cloud service and without connectivity for most operations.

---

## 4. Goals and Non-Goals

### 4.1 Product Goals

* Demonstrate meaningful, non-trivial usage of all three Tether technologies (QVAC, Pears, WDK) — not superficial integration.
* Prove that a full club/tournament lifecycle (setup → operation → payment → prediction → payout) can run entirely offline on a local network.
* Showcase private, on-device AI that produces genuinely useful coaching and tactical output, not a novelty chatbot.
* Deliver a polished, demoable MVP by the hackathon deadline that can be credibly extended into a real product.

### 4.2 Business Goals (Post-Hackathon)

* Validate demand with 3–5 pilot grassroots clubs or academies within 60 days of the hackathon.
* Establish a lightweight monetization path (e.g., a small protocol fee on prediction pools, or premium AI features) that does not compromise the self-custodial, offline-first thesis.

### 4.3 Non-Goals (Explicitly Out of Scope for MVP)

* Professional/elite-level scouting analytics (e.g., broadcast-quality tracking data, wearable sensor integration).
* Real-money gambling in jurisdictions where this is not legal — the prediction market defaults to points-only mode unless organizers explicitly opt into real-money pools where legally permitted, and PitchOS is not responsible for jurisdictional compliance.
* Native mobile apps (iOS/Android) — MVP targets responsive web/PWA only; native shells are a post-hackathon consideration.
* Video hosting/streaming infrastructure — match video is processed locally for AI analysis, not broadcast.
* Full multi-language localization of the UI (only AI-mediated translation of user-generated content is in scope).

---

## 5. Target Users and Personas

### 5.1 Primary Users

| Persona | Description | Core Need |
|---|---|---|
| **Club Administrator** (e.g., "Coach Amara") | Runs a grassroots club or academy, often as a volunteer | Simple roster, attendance, and fee collection without spreadsheets |
| **Tournament Organizer** (e.g., "Rahul") | Runs school or community tournaments seasonally | Fast bracket generation, transparent entry fees, live standings |
| **Coach** (e.g., "Coach Diego") | Trains players, wants data-driven feedback | Actionable, private technique/tactical analysis without cloud tools |
| **Player** (e.g., "Sarah, 16") | Wants to improve and track progress | Personalized training plans; privacy for her data as a minor |

### 5.2 Secondary Users

| Persona | Description | Core Need |
|---|---|---|
| **Parent** | Pays fees, tracks child's participation | Transparent, low-friction payments and visibility into activity |
| **Fan** | Follows local matches and tournaments | Live scores, prediction games, community engagement |
| **Referee** | Officiates matches | Simple match event logging (goals, cards, subs) |
| **Scout** | Looks for talent in grassroots leagues | Access to aggregated, consented performance data |
| **Volunteer** | Supports club operations | Lightweight role-based tasks (chat moderation, check-in) |

### 5.3 Key User Constraints

* Devices are often mid-range Android phones with variable connectivity.
* Many users are not technically sophisticated — onboarding must be extremely low-friction (target: club created in under 2 minutes).
* A meaningful share of end users (players) are minors, which shapes privacy and consent requirements throughout.

---

## 6. Detailed Feature Requirements

Each feature below includes purpose, functional requirements, and acceptance criteria to guide implementation and demo scripting.

### 6.1 Club Management

**Purpose:** Replace WhatsApp + Google Sheets as the system of record for a club.

**Functional Requirements**
* Create a club with name, crest/logo, location, and age category.
* Invite members via shareable code or QR (works offline over local Hyperswarm discovery, or via link when online).
* Role-based access: Owner, Admin, Coach, Player, Parent, Volunteer — each with scoped permissions.
* Team roster with player profiles (name, position, jersey number, physical stats, emergency contact — parent-controlled for minors).
* Attendance tracking per training session and match.
* Announcements board with read receipts.
* Training schedule with recurring sessions and calendar view.
* Match history log, auto-populated from Live Match Center data.

**Acceptance Criteria**
* A club can be created and a second device can join and see the same roster within 1 second on a local network (see Success Metrics).
* Role permissions are enforced (e.g., a Player cannot edit the roster).
* All club data persists locally (IndexedDB) and replicates via Hypercore/Autobase without any server dependency.

---

### 6.2 AI Coach (QVAC)

**Purpose:** Give every player and coach access to private, on-device technical and tactical feedback.

**Inputs:** match videos, training videos, free-text questions, structured statistics.

**Outputs:** technique feedback, passing analysis, shooting analysis, tactical suggestions, weakness detection, personalized training plans, weekly improvement reports.

**Functional Requirements**
* Video ingestion pipeline runs entirely on-device (no upload to any server).
* Text/Q&A interface for coaches to ask free-form questions ("How is Sarah's shooting technique trending?").
* Weekly auto-generated report per player, summarizing progress and flagging weaknesses.
* Feedback is explainable — outputs include the reasoning basis (e.g., "detected backward lean during shot contact in 3 of 5 clips").

**Example Output**
> "You lean backward while shooting. Practice finishing with your body over the ball."

**Acceptance Criteria**
* AI coaching response is generated in under 5 seconds for a text query (see Success Metrics).
* No network call is made during inference (verifiable via network monitor in demo).
* Output is stored locally and associated with the player's profile for trend tracking over time.

---

### 6.3 Match Analysis

**Purpose:** Turn raw match footage into structured tactical insight without cloud video processing.

**Functional Requirements**
* Upload/import match footage from device storage.
* Generate: match summary, possession insights, tactical weaknesses, standout player identification, heatmap suggestions, formation recommendations, per-player ratings.
* All processing on-device; results cached locally and shareable via Pears with team members.

**Acceptance Criteria**
* A full match analysis report is generated without any outbound network request.
* Report is attached to the corresponding match record in Club Management and Match History.

---

### 6.4 Tactical Assistant

**Purpose:** On-demand tactical coaching, like a private assistant coach.

**Functional Requirements**
* Natural-language query interface (e.g., "How do I defend against a 4-3-3?").
* Output includes tactical diagrams (rendered visually, not just text), defensive shape recommendations, pressing strategy, and suggested training drills.
* Fully functional offline.

**Acceptance Criteria**
* Given a formation-based question, the assistant returns a diagram plus at least 2 concrete drills within 5 seconds, offline.

---

### 6.5 Live Match Center

**Purpose:** Real-time match tracking without an internet-dependent scoreboard service.

**Functional Requirements**
* Track: live score, timeline, cards, goals, substitutions, possession updates.
* Any connected device on the local Pears swarm sees updates in near real time.
* Match state is conflict-resistant (via Autobase causal ordering) if multiple devices log events concurrently (e.g., referee and assistant both logging a card).

**Acceptance Criteria**
* An event logged on one device (e.g., a goal) appears on all other connected devices within 1 second on a local network, with no internet required.
* Conflicting concurrent edits resolve deterministically without data loss.

---

### 6.6 Tournament Management

**Purpose:** Replace paper brackets and manual standings tracking.

**Functional Requirements**
* Tournament creation with configurable format: Knockout, Round Robin, or hybrid group-stage + knockout.
* Team registration with entry fee collection (via WDK).
* Automatic fixture generation based on registered teams and format.
* Live standings computed from Match Center results.
* Support for multiple concurrent tournaments (e.g., age-group brackets running in parallel).

**Acceptance Criteria**
* Tournament creation to first fixture generated in under 3 minutes (see Success Metrics).
* Standings update automatically and correctly as match results are logged, with no manual recalculation.

---

### 6.7 Club Wallet (WDK)

**Purpose:** Give every participant a self-custodial wallet for all club-related financial flows.

**Functional Requirements**
* Wallet auto-created (or imported) on user onboarding; keys never leave the user's device.
* Supported flows: membership fees, tournament registration, donations, prize distribution, sponsorship payouts, merchandise payments.
* Transaction history visible per user and, where relevant, aggregated at the club level (e.g., total fees collected) without any party other than the payer/payee custodying funds.
* Multi-currency/stablecoin support consistent with WDK capabilities (primarily USD₮).

**Acceptance Criteria**
* Wallet setup completes in under 1 minute for a new user (see Success Metrics).
* A membership fee payment settles directly between payer and club wallet with no intermediary custody at any point.
* Transaction records are independently verifiable by both parties.

---

### 6.8 Prediction Market

**Purpose:** Turn informal, cash-based prediction games into a transparent, optionally real-money system with self-custodial escrow.

**Prediction Modes**
* Match Winner (Home / Draw / Away)
* Correct Score (e.g., 2–1, 3–0, 1–1)
* First Goal Scorer
* Total Goals (Over/Under 2.5)
* Both Teams Score (Yes/No)
* Player of the Match
* Tournament Champion (pre-tournament)

**Prize Pool Mechanics**
* Organizers configure: pool name, entry fee, target prize pool, maximum participants.
* Example: Pool "Champions League Final," entry fee 5 USD₮, prize pool 500 USD₮, max 100 participants.
* Funds remain in transparent, self-custodial escrow (via WDK) until results are finalized; payout logic is deterministic and auditable.
* **Points-only mode** is available and is the default configuration, allowing clubs/regions to avoid real-money participation where required by local law or club policy. Organizers must explicitly opt into real-money pools.

**Acceptance Criteria**
* A prediction pool can be created, joined, and resolved end-to-end in points-only mode without any real-money dependency.
* Where real-money mode is enabled, payout to winners is executed transparently and funds are never held by a custodial third party at rest.

**Compliance Note**
Real-money prediction pools may be legally restricted or prohibited depending on jurisdiction. PitchOS ships with points-only mode as the default and surfaces a clear disclaimer when real-money mode is enabled; responsibility for legal compliance in a given region rests with the organizer enabling that mode.

---

### 6.9 AI Prediction Assistant (QVAC)

**Purpose:** Give predictors a transparent, locally-generated rationale rather than a black-box probability.

**Inputs:** recent form, historical performance, head-to-head results, team statistics, user preferences.

**Output Example**
> Barcelona Win — Probability: 71%, Confidence: High
> Reasons: better recent form, home advantage, opponent missing key defenders.

**Acceptance Criteria**
* Every prediction surfaces a probability, a confidence level, and at least two human-readable reasons.
* Inference runs on-device with no cloud dependency.

---

### 6.10 Private Prediction Circles

**Purpose:** Social, friend-group-based prediction games.

**Functional Requirements**
* Create a private group (e.g., "Weekend Football Circle") with named members.
* Shared prediction rounds with a live-updating leaderboard.
* Synchronization via Pears so all members see consistent state without a central server.

**Acceptance Criteria**
* Leaderboard updates propagate to all circle members within 1 second on a local network.

---

### 6.11 Live AI Commentary

**Purpose:** Add broadcast-style engagement to grassroots matches that would otherwise have none.

**Functional Requirements**
* Generate natural-language commentary keyed to match events (goals, momentum shifts, cards) in real time.
* Runs entirely on-device.

**Example**
> "Manchester United equalize in the 76th minute. Momentum has shifted dramatically."

**Acceptance Criteria**
* Commentary is generated within a few seconds of the triggering event being logged, with no network dependency.

---

### 6.12 Fan Rewards

**Purpose:** Drive engagement and reward participation without requiring real-money mechanics.

**Functional Requirements**
* Earn points for: prediction streaks, attendance badges, community participation, club loyalty, volunteer recognition.
* Clubs can define redemption options (merchandise, tickets, discounts, tournament perks).

**Acceptance Criteria**
* Points accrue automatically based on defined triggers and are visible in a user's profile.

---

### 6.13 AI Translator

**Purpose:** Support multilingual football communities without a cloud translation dependency.

**Functional Requirements**
* Translate coach instructions, chat messages, announcements, and match commentary.
* Runs on-device, integrated inline into chat and announcement views.

**Acceptance Criteria**
* A message sent in one language is displayed correctly translated to a recipient's configured language, offline.

---

### 6.14 Team Chat

**Purpose:** Replace WhatsApp with a purpose-built, decentralized messaging layer.

**Functional Requirements**
* Team chat, coach announcements, match discussion threads, voice notes, image sharing.
* Messages synchronize via Pears; history is retained locally per device.

**Acceptance Criteria**
* Messages sent while offline sync automatically once peers reconnect, with correct ordering.

---

### 6.15 Offline Emergency Mode

**Purpose:** Guarantee that core operations never depend on internet availability.

**Functionality that must remain available with zero internet:**
* Messaging
* Tournament brackets
* Match updates
* Prediction circles
* Wallet access (viewing balance, signing transactions for later broadcast)
* Club database
* Attendance

**Acceptance Criteria**
* With Wi-Fi/cellular fully disabled, all listed functions operate correctly on a local peer network (e.g., local Wi-Fi hotspot with no internet uplink), demonstrated live in the demo.

---

## 7. User Flows

### 7.1 Club Setup Flow
Create Club → Invite Members → Create Teams → Schedule Training → Collect Membership Fees → Start Season

### 7.2 Match Flow
Create Match → Players Check In → Live Score Updates → AI Commentary → Prediction Market → Generate Match Report → Update Player Statistics

### 7.3 Tournament Flow
Create Tournament → Team Registration → Entry Fees → Fixture Generation → Live Scores → Prediction Pools → Prize Distribution

---

## 8. Technical Architecture

### 8.1 Frontend
* React + Next.js
* Tailwind CSS
* TypeScript
* PWA-capable for installability and offline caching of app shell

### 8.2 Local Data Layer
* IndexedDB for structured local state (club data, rosters, match history)
* Hypercore storage as the append-only log underlying all replicated data

### 8.3 Peer-to-Peer Layer (Pears)
* **Pear CLI** for app packaging/runtime
* **Hyperswarm** for peer discovery (local network and DHT-based when online)
* **Hypercore** as the core append-only replication primitive
* **Autobase** to merge multi-writer logs (e.g., multiple coaches logging match events) into a single consistent, causally-ordered view

**Used for:** messaging, live score synchronization, club database replication, tournament synchronization, prediction circles.

### 8.4 AI Layer (QVAC)
**Used for:** AI Coach, Match Analysis, Tactical Assistant, Commentary, Translation, Prediction Assistant.
All inference executes on-device; no player data, video, or statistics are transmitted for AI processing at any point.

### 8.5 Payments Layer (WDK)
**Used for:** wallet creation, membership payments, prize pools, donations, ticket purchases, prediction pool escrow.
Keys are generated and held client-side; PitchOS never has custody of user funds.

### 8.6 High-Level Data Flow

```
┌─────────────┐     Hyperswarm/Autobase     ┌─────────────┐
│  Device A   │◄───────────────────────────►│  Device B   │
│ (Coach)     │      Hypercore replication    │ (Player)    │
├─────────────┤                              ├─────────────┤
│ IndexedDB   │                              │ IndexedDB   │
│ QVAC (AI)   │  ← no network calls          │ QVAC (AI)   │
│ WDK Wallet  │◄──── direct P2P settlement ──►│ WDK Wallet  │
└─────────────┘                              └─────────────┘
```

### 8.7 Security & Privacy Considerations
* Minors' data (player profiles under 18) is scoped to club-role permissions and never leaves the local device/swarm for AI processing.
* Wallet private keys never leave the client device; no PitchOS-operated service ever holds custody.
* Chat and club data are encrypted in transit within the Hyperswarm/Hypercore replication layer.
* Real-money prediction pools display explicit jurisdictional disclaimers and default to disabled.

---

## 9. MVP Scope (Target: July 8)

* Club creation
* Player management
* Local AI coaching assistant (text Q&A + basic feedback)
* Live match updates over Pears
* Tournament bracket (single format, e.g., knockout)
* WDK wallet creation
* Tournament entry payments
* Prediction circles (points mode only)
* AI prediction explanations

## 10. Phase 2 (Target: July 12)

* Video-based match analysis
* Live AI commentary
* Fan leaderboards
* Donations
* Merchandise payments
* Multilingual translation
* Enhanced prediction analytics (additional prediction modes: correct score, total goals, BTTS)
* Improved synchronization robustness (multi-writer conflict handling at scale)

## 11. Final Phase (Target: July 14)

* Complete UI polish and design system consistency
* Advanced dashboards (club-level and player-level analytics)
* Full tournament lifecycle (registration → fixtures → live play → prediction pools → prize distribution)
* Live presentation/demo mode
* Rich analytics and club insights
* Enhanced AI recommendations (weekly reports, weakness trend tracking)
* End-to-end demo workflow rehearsed and timed

---

## 12. Success Metrics

| Metric | Target |
|---|---|
| Club creation time | Under 2 minutes |
| Peer synchronization latency (local network) | Under 1 second |
| AI coaching response time | Under 5 seconds |
| Wallet setup time | Under 1 minute |
| Tournament creation time | Under 3 minutes |
| Offline operation during demo | 100% of core features functional with no internet |

### 12.1 Post-Hackathon KPIs (Directional)
* Number of pilot clubs onboarded within 60 days
* Weekly active club admins / coaches
* Percentage of matches logged via Live Match Center vs. manual methods
* Prediction pool participation rate per tournament

---

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| On-device AI model size/performance too heavy for mid-range devices | Degraded UX, missed demo targets | Use quantized/optimized models within QVAC; fall back to simpler heuristics for lower-end devices |
| Multi-writer sync conflicts (e.g., simultaneous match event logging) | Data inconsistency | Rely on Autobase causal ordering; define deterministic conflict-resolution rules per data type |
| Real-money prediction pools raising legal/regulatory concerns | Compliance risk, reputational risk | Default to points-only mode; explicit opt-in and disclaimers for real-money mode; no PitchOS custody of funds |
| Minors' data privacy | Legal/regulatory risk, user trust | On-device-only processing, parent-controlled profile fields, role-scoped access |
| Scope creep across 15 features in a short hackathon window | Missed deadline, unpolished demo | Strict MVP scope gate (Section 9); Phase 2/Final Phase features are explicitly deferred |
| Judges unable to verify "offline" claims live | Weakened credibility of core thesis | Build demo script with visible network-disabled state (e.g., airplane mode) during key flows |

---

## 14. Why PitchOS Can Win

**Technical Ambition** — Combines decentralized networking, local AI, and self-custodial payments into one cohesive platform rather than using each technology in isolation.

**User Experience** — A single application replaces multiple disconnected tools currently used by football clubs and tournaments.

**Real-World Use** — Designed for grassroots football organizations, schools, academies, and community leagues globally, addressing a genuine and underserved market.

**Creativity** — Introduces AI-powered coaching, offline collaboration, and decentralized prediction circles in a single football operating system.

**Strong Stack Utilization**
* **QVAC:** Local AI coaching, tactical analysis, translation, commentary, and prediction insights.
* **Pears:** Peer-to-peer messaging, synchronization, live match events, and offline collaboration.
* **WDK:** Self-custodial wallets, payments, donations, prize pools, and prediction rewards.

---

## 15. Elevator Pitch

**PitchOS is the first offline-first AI operating system for football communities. It enables clubs to coach players with private on-device AI, synchronize tournaments without centralized servers, and manage payments and prediction pools through self-custodial wallets — bringing grassroots football into the decentralized era.**

---

## 16. Open Questions

* What is the minimum viable on-device AI model that delivers credible coaching feedback without excessive load time on mid-range devices?
* Should prize pool payout logic be resolved automatically (oracle-based match result feeds) or require organizer confirmation, given the offline-first constraint?
* What is the fallback UX when two devices have been offline for an extended period and reconnect with significantly diverged state?
* How should the product handle jurisdictions where any prediction market, even points-only, may face regulatory scrutiny?
