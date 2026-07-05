# PitchOS — Technical Architecture Document

**Document Type:** Architecture Design Document (ADD)
**Author:** Architecture Lead
**Version:** 2.1 (Next.js + standalone Relay service + Supabase)
**Date:** July 5, 2026
**Status:** Draft for Review


---

## A Note on Scope Before We Start

PitchOS's product thesis is **offline-first and decentralized by design**: club data, match events, and AI inference are meant to live and run on end-user devices, synchronized peer-to-peer, with self-custodial wallets. That is a deliberate departure from a conventional client-server SaaS.

This document honors that thesis but also answers the brief given for it: a rigorous architecture with explicit stack choices, deployment model, NFRs, diagrams, and operational practices — the discipline expected of "a typical scalable web service." In practice, PitchOS needs **both**:

1. A **Client-Local Core** (the actual product experience) — P2P sync, on-device AI, self-custodial wallet. This has no authoritative central server for user data, by design.
2. A **thin, optional Supporting Services layer** — a conventional, cloud-hosted backend that does the things P2P architectures genuinely need help with: NAT traversal/rendezvous, public web presence (shareable tournament pages, SEO), push notifications, opt-in aggregate telemetry, and admin/support tooling.

The Supporting Services layer holds **no authoritative copy of club, player, match, or wallet data** — that data's source of truth is always the Hypercore logs on user devices. The backend is a convenience and reachability layer, not a database of record. This distinction is repeated throughout this document because it drives almost every downstream decision (data modeling, security, DR).

---

## 1. System Overview

### 1.1 Purpose

PitchOS is a decentralized, AI-powered operating system for grassroots football communities. This architecture document defines how the system is built, deployed, and operated to meet the product requirements in the PRD (v2.0), with a focus on reliability, security, and scalability of both the client-side P2P/AI core and the supporting cloud services.

### 1.2 Scope

In scope for this document:
* The Client-Local Core architecture (app runtime, local storage, AI runtime, wallet).
* The Pears P2P networking layer and its interaction with supporting infrastructure.
* The Supporting Services backend: a Next.js application (Public Gateway, Notifications, Telemetry, Admin) plus a standalone Relay/Rendezvous service.
* Deployment topology across dev/stage/prod.
* Security, compliance, observability, and disaster recovery for both layers.

Out of scope:
* Deep model architecture of QVAC's AI models (covered by QVAC's own documentation).
* WDK's internal cryptographic implementation (covered by WDK's own documentation).
* Native mobile app store distribution mechanics (post-MVP).

### 1.3 Key Stakeholders

| Stakeholder | Interest |
|---|---|
| Hackathon judges (Tether Developers Cup) | Verifiable, credible use of QVAC / Pears / WDK; live offline demo |
| Club administrators / coaches | Reliability, ease of use, data ownership |
| Players / parents | Privacy, especially for minors' data |
| Tournament organizers | Correctness of brackets, fee handling, prediction payouts |
| Engineering team | Maintainability, clear module boundaries, low operational burden |
| Future investors / partners | Scalability story beyond a single hackathon demo |

### 1.4 High-Level Architecture

```
                              ┌───────────────────────────────────────┐
                              │          SUPPORTING SERVICES            │
                              │                                         │
                              │  ┌───────────────────────────────────┐  │
                              │  │      Next.js app (Route Handlers)   │  │
                              │  │  ┌─────────┐ ┌───────┐ ┌─────────┐  │  │
                              │  │  │ Public  │ │ Notif │ │Telemetry│  │  │
                              │  │  │ Gateway │ │-ication│ │(opt-in) │  │  │
                              │  │  └─────────┘ └───────┘ └─────────┘  │  │
                              │  │  ┌─────────┐                        │  │
                              │  │  │  Admin  │                        │  │
                              │  │  └─────────┘                        │  │
                              │  └───────────────────────────────────┘  │
                              │                                         │
                              │  ┌───────────────────────────────────┐  │
                              │  │   Relay / Rendezvous (standalone)   │  │
                              │  │   Node + WebSocket, always-on       │  │
                              │  └───────────────────────────────────┘  │
                              │                                         │
                              │  Both deployables connected to:         │
                              │  ┌───────────────────────────────────┐  │
                              │  │  SUPABASE                          │  │
                              │  │  ├─ Postgres + RLS policies        │  │
                              │  │  ├─ Storage (S3-compatible)        │  │
                              │  │  └─ Custom JWT auth (DID-based)    │  │
                              │  └───────────────────────────────────┘  │
                              └───────────────┬─────────────────────────┘
                                              │ (optional, non-authoritative)
                     ┌────────────────────────┼────────────────────────┐
                     │                        │                        │
             ┌───────▼───────┐        ┌───────▼───────┐        ┌───────▼───────┐
             │   Device A     │◄──────►│   Device B     │◄──────►│   Device C     │
             │ CLIENT-LOCAL   │Hyperswarm│ CLIENT-LOCAL │Hyperswarm│ CLIENT-LOCAL │
             │     CORE       │ P2P mesh │     CORE     │ P2P mesh │     CORE     │
             ├────────────────┤        ├────────────────┤        ├────────────────┤
             │ Next.js UI/PWA │        │ Next.js UI/PWA │        │ Next.js UI/PWA │
             │ QVAC AI runtime│        │ QVAC AI runtime│        │ QVAC AI runtime│
             │ Hypercore/     │        │ Hypercore/     │        │ Hypercore/     │
             │ Autobase log   │        │ Autobase log   │        │ Autobase log   │
             │ IndexedDB      │        │ IndexedDB      │        │ IndexedDB      │
             │ WDK Wallet     │        │ WDK Wallet     │        │ WDK Wallet     │
             └────────────────┘        └────────────────┘        └────────────────┘
```

**Key architectural principle:** arrows into Supporting Services are optional by design — every core user journey (club ops, match tracking, payments, predictions) must complete correctly with that entire box unreachable.

---

## 2. Functional and Non-Functional Requirements

### 2.1 Functional Requirements (Summary — see PRD for full detail)

* FR-1: Users can create/join clubs, rosters, and teams, replicated P2P.
* FR-2: Users can run/log matches and tournaments in real time, online or offline.
* FR-3: Users receive on-device AI coaching, analysis, and translation.
* FR-4: Users hold self-custodial wallets and transact fees/prizes/donations.
* FR-5: Users can participate in prediction pools/circles, points or real-money mode.
* FR-6: Non-installed users (e.g., a scout or parent without the app) can view a public, read-only tournament page via a web link.

### 2.2 Non-Functional Requirements

| Category | Requirement | Target / Metric |
|---|---|---|
| **Reliability** | Client-Local Core functions with zero backend connectivity | 100% of core flows (Section 6.15 of PRD) pass with network disabled |
| **Reliability** | Supporting Services availability (best-effort, non-critical) | 99.5% monthly uptime (not 99.99% — it is not on the critical path) |
| **Performance** | P2P sync latency, local network | < 1 second for a single event (goal, chat message) |
| **Performance** | On-device AI response latency | < 5 seconds for text/coaching queries |
| **Performance** | Relay-assisted sync latency (devices behind NAT, over internet) | < 3 seconds p95 |
| **Performance** | Public Gateway page load | < 2 seconds p95 (cold), < 500ms (cached) |
| **Scalability** | Relay service horizontal scale | Stateless WebSocket handling scales to 50k concurrent relay sessions per region without redesign |
| **Scalability** | P2P mesh | No architectural ceiling from PitchOS; bounded by Hyperswarm/DHT practical swarm sizes (design for clubs/tournaments of up to ~2,000 concurrent peers per swarm) |
| **Security** | Wallet key custody | Private keys never transmitted or stored server-side, ever |
| **Security** | Data-in-transit | TLS 1.3 for all Supporting Services traffic; Hypercore's built-in encrypted replication for P2P traffic |
| **Security** | Data-at-rest (device) | Local storage encrypted using platform-native encryption (e.g., IndexedDB behind OS-level disk encryption; explicit app-level encryption for exported backups) |
| **Maintainability** | Backend architecture | Two deployables (Next.js app + Relay service), each internally organized folder-by-domain with enforced module boundaries via dependency-graph linting |
| **Maintainability** | Client architecture | Feature-based module structure; AI, sync, and wallet layers behind clean adapter interfaces so QVAC/Pears/WDK SDK upgrades are isolated |
| **Compliance** | Minors' data | No minors' data processed off-device; parent-managed consent fields |
| **Observability** | Supporting Services | 100% of services emit structured logs, metrics, and traces to the observability stack |

---

## 3. Hardware and Deployment Model

### 3.1 Environments

| Environment | Purpose | Notes |
|---|---|---|
| **Local (dev)** | Individual engineer development | `docker compose up` starts Next.js app, Relay service, Postgres, Redis; multiple browser/emulator instances simulate P2P peers on one machine |
| **Dev (shared)** | Integration testing, feature branches | Auto-deployed per PR via ephemeral preview environments (Vercel preview for Next.js app; ephemeral container for Relay) |
| **Staging** | Pre-production validation, demo rehearsal | Mirrors prod topology at reduced scale; used for hackathon demo rehearsal with real device swarms |
| **Production** | Live service | Multi-region for the Relay service and edge-served Next.js app; single-region acceptable for Admin/Telemetry data store at MVP scale |

### 3.2 Cloud vs. On-Prem

**Recommendation: Cloud-hosted, no on-prem component.** Rationale:

* Supporting Services are explicitly non-authoritative and mostly stateless — no data-sovereignty argument for on-prem.
* Team size (hackathon-origin) favors managed services over infra-heavy on-prem operations.
* Multi-region presence for the Relay service and edge delivery for the Next.js app are both easier on a hyperscaler or edge-friendly PaaS than on-prem.

**Split deployment target, reflecting the two different runtime shapes:**

| Component | Hosting | Why |
|---|---|---|
| Next.js app (Public Gateway, Notifications, Telemetry, Admin) | **Vercel** (or Cloudflare Pages + Workers as an alternative) | Request/response workload; benefits from edge caching for public tournament pages; zero server management |
| Relay service | **Fly.io Machines** (or a small managed container host / lightweight k8s) — NOT serverless | Needs always-on processes holding persistent WebSocket connections; serverless platforms terminate idle connections and don't fit this workload |
| **Supabase** (Postgres + Storage + Auth) | Cloud-hosted (Supabase) | Single unified managed backend: Postgres with RLS policies for authorization, S3-compatible storage for assets (club crests, exports), custom JWT authentication for DID-based identity. Shared by both Next.js app and Relay service. |
| Redis | Managed (Upstash) | Rate limiting and session state for Next.js API routes; pub/sub channel for Relay→Notifications cross-service events (only for opt-in telemetry and notification fan-out, not core product) |

### 3.3 Containerization

* **Next.js app:** deployed via Vercel's native build pipeline (no Dockerfile needed) for simplicity; a Dockerfile is still maintained for local dev parity (`docker compose`) and as a portability fallback if the team later needs to self-host.
* **Relay service:** ships as a container image (multi-stage Dockerfile, `node:20-alpine` runtime stage) since it runs on Fly.io Machines / a container host rather than Vercel. This is the one component that genuinely needs container orchestration.
* Both components share a common base Docker image definition and linting/build tooling to minimize drift.

### 3.4 CI/CD

**Pipeline: GitHub Actions**, split by deployable:

```
on: push/PR
 ├─ lint + typecheck (eslint, tsc --noEmit) — both apps
 ├─ dependency-graph check (dependency-cruiser) — enforce folder module boundaries
 ├─ unit tests (Vitest) — both apps
 ├─ integration tests (Testcontainers: Postgres, Redis)
 │
 ├─ [next-app changes] → Vercel preview deploy (PR) → Vercel production (on merge to main)
 │
 └─ [relay-service changes]
     ├─ build Docker image
     ├─ security scan (Trivy for image, npm audit/Snyk for deps)
     ├─ push image to registry (GHCR)
     └─ deploy
         ├─ PR branch → ephemeral Fly.io app (auto-teardown after 48h)
         ├─ main branch → staging Fly.io app (auto-deploy)
         └─ tagged release → production Fly.io app (manual approval gate)
```

* Path-based triggers (`next-app/**` vs. `relay-service/**` in a monorepo) ensure each deployable only rebuilds/redeploys when its own code changes.
* Infrastructure as Code: **Terraform** for cloud resources that aren't natively managed by Vercel/Fly (Postgres, Redis, DNS, Relay load balancer), applied via a dedicated CI job with plan-then-apply and manual approval for prod.

### 3.5 Monorepo Layout

```
pitchos/
 ├─ apps/
 │   ├─ client/            # Next.js PWA — the actual product (Client-Local Core UI)
 │   ├─ next-app/          # Next.js Supporting Services (Gateway, Notif, Telemetry, Admin)
 │   └─ relay-service/     # Standalone Node + WebSocket Relay
 ├─ packages/
 │   ├─ shared-types/      # Shared TS types/DTOs (e.g., Protobuf-generated, DID auth types)
 │   ├─ sync-adapter/      # Pears/Hypercore/Autobase wrapper used by client
 │   ├─ ai-adapter/        # QVAC wrapper used by client
 │   └─ wallet-adapter/    # WDK wrapper used by client
 └─ infra/                 # Terraform
```

---

## 4. Tech Stack Specification

### 4.1 Client-Local Core

| Layer | Technology | Justification |
|---|---|---|
| UI Framework | React + Next.js (App Router), TypeScript | Mature ecosystem, strong PWA support, team familiarity |
| Styling | Tailwind CSS | Fast iteration, consistent design tokens, small CSS footprint for offline caching |
| Local structured storage | IndexedDB (via Dexie.js wrapper) | Native browser persistence; Dexie simplifies schema versioning/migrations |
| P2P replication log | Hypercore | Append-only, verifiable log — ideal source-of-truth primitive for offline-first sync |
| Multi-writer merge | Autobase | Provides causal ordering across multiple devices writing concurrently (e.g., two coaches logging match events) |
| Peer discovery / transport | Hyperswarm | DHT-based discovery + NAT traversal; falls back to the Relay service when direct/DHT connection fails |
| Runtime packaging | Pear CLI / Pear runtime | Native support for Hypercore-stack apps; enables installable, offline-capable app packaging |
| On-device AI | QVAC runtime (quantized models, WebGPU/WASM execution) | Mandated by hackathon track; keeps all inference local, satisfying minors'-data and offline requirements |
| Wallet | WDK (Wallet Development Kit) | Mandated by hackathon track; self-custodial key management and USD₮ transaction signing |
| Offline app shell caching | Service Worker (Workbox) | Standard PWA pattern for asset caching so the app shell loads without connectivity |

### 4.2 Supporting Services

| Component | Technology | Justification |
|---|---|---|
| Public Gateway, Notifications, Telemetry, Admin | **Next.js (Route Handlers, App Router)**, TypeScript | Same language/framework as the client — one team, one set of conventions, one CI toolchain. These four modules are all conventional request/response REST workloads with no persistent-connection requirement, which is exactly what Next.js Route Handlers are built for. SSR is a bonus for the public tournament pages (SEO, fast first paint). |
| Relay / Rendezvous | **Standalone Node.js service**, `ws` library (or Fastify + `@fastify/websocket` for more structure) | Needs long-lived WebSocket connections for NAT traversal signaling and encrypted-blob relaying — a fundamentally different runtime shape than request/response. Serverless/edge functions (including Vercel's) tear down on response completion and cannot host persistent sockets, so this is deliberately kept as its own always-on deployable rather than forced into Next.js. |
| **Database + Storage** | **Supabase** (PostgreSQL 16 + RLS + Storage) | Unified managed backend: Postgres provides relational integrity for operational data (public tournaments, subscriptions, telemetry, relay session metadata); Row Level Security (RLS) enforces authorization at the database layer, strengthening DID-based auth. Storage provides S3-compatible file hosting for club crests and exports. Shared by both Next.js app and Relay service. Migration tooling via standard Postgres migration tools. |
| Caching / ephemeral state | Redis (managed, e.g., Upstash) | Rate limiting and short-lived session state for the Next.js app; pub/sub channel for Relay→Notifications cross-service events (only for opt-in telemetry fan-out, not core product) |
| Messaging / internal eventing | Redis Streams (MVP) → NATS (post-MVP, if a third deployable joins) | Redis Streams avoids introducing a new dependency at MVP, and is sufficient for the low volume of cross-deployable events (Relay → Notifications) |
| Search (public tournament/club discovery) | PostgreSQL full-text search (MVP) → OpenSearch (only if discovery volume grows) | Avoids operating a search cluster before there's a proven need |
| Push notifications | Firebase Cloud Messaging (Android/web push) + APNs (iOS, post-MVP) | Industry-standard, avoids building notification infrastructure from scratch |
| Observability | OpenTelemetry (instrumentation in both deployables) → Grafana stack: Prometheus (metrics), Loki (logs), Tempo (traces), Grafana (dashboards) | Open-source, avoids vendor lock-in; OpenTelemetry keeps instrumentation portable across Vercel + Fly.io |
| Error tracking | Sentry | Native Next.js integration; also supports plain Node, covering the Relay service |
| API style | REST (OpenAPI 3.1) for Public Gateway/Admin/Notifications (Next.js Route Handlers); WebSocket + Protobuf for Relay signaling | REST is sufficient and simpler to document/version for low-frequency public endpoints; WebSocket is required for real-time relay signaling |
| Data interchange format | JSON over REST; Protobuf for the Relay signaling protocol | JSON for human-debuggable, low-volume public APIs; Protobuf for the high-frequency, latency-sensitive relay/signaling channel where payload size and parse speed matter |
| **Authentication & Authorization** | **Supabase custom-JWT auth** (DID-based) + **PostgreSQL RLS policies** | Client signs a nonce with WDK-derived key; the backend verifies the signature and mints a short-lived JWT with the DID in the `sub` claim (per Supabase's custom-auth pattern). Both Next.js and Relay verify the same JWT signature using the Supabase JWT secret. RLS policies in Postgres enforce row-level authorization (e.g., a device can only read/write its own notifications) directly at the database layer, independent of application logic — defense-in-depth. No username/password store on backend; identity is self-sovereign. |

### 4.3 Why Two Deployables Instead of One Framework for Everything

* **Runtime shape mismatch is the deciding factor, not team preference.** Public Gateway/Notifications/Telemetry/Admin are stateless request/response; Relay is stateful, long-lived, and latency-sensitive. Forcing both into Next.js would mean running Next.js on a custom always-on Node server for the whole app just to support the one WebSocket-heavy module — losing Vercel's zero-ops edge deployment for the 80% of the backend that doesn't need it.
* **Module-boundary discipline without a DI framework.** Since Next.js Route Handlers don't give you NestJS-style enforced module boundaries out of the box, boundaries are instead enforced by: (a) folder-by-domain structure (`app/api/gateway/`, `app/api/notifications/`, `app/api/telemetry/`, `app/api/admin/`), (b) a `dependency-cruiser` rule in CI that fails the build if one domain folder imports another domain folder's internals directly (only shared `packages/shared-types` may be imported across domains), and (c) each domain owning its own Postgres schema/namespace with no cross-schema queries from application code.
* **This still leaves a clean extraction path.** If any one Next.js API domain (most likely Telemetry, if volume grows significantly) needs independent scaling later, it can be pulled into its own Next.js API deployment or a small dedicated service, since it's already isolated by folder and schema.

---

## 5. Architecture Diagrams

### 5.1 Component Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                          CLIENT-LOCAL CORE                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐            │
│  │ UI Layer  │  │ Sync      │  │ AI Layer  │  │ Wallet    │            │
│  │ (Next.js) │  │ (Pears)   │  │ (QVAC)    │  │ (WDK)     │            │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘            │
│        │              │              │              │                  │
│        └──────────────┴──────┬───────┴──────────────┘                  │
│                               │                                        │
│                     ┌─────────▼─────────┐                              │
│                     │  Local Data Layer  │                              │
│                     │ (IndexedDB +       │                              │
│                     │  Hypercore log)    │                              │
│                     └────────────────────┘                              │
└───────────────────────────────────────────────────────────────────────┘
          │                                              │
          │ REST (JSON, TLS)                             │ WebSocket (Protobuf, TLS)
          ▼                                              ▼
┌────────────────────────────────┐         ┌───────────────────────────────┐
│     NEXT.JS APP (Vercel)        │         │   RELAY SERVICE (Fly.io)       │
│  ┌──────────┐ ┌───────────────┐ │         │                                │
│  │ Public   │ │ Notification  │ │◄───────►│  Always-on WebSocket server    │
│  │ Gateway  │ │   (Route      │ │ Redis   │  - NAT traversal signaling     │
│  │ (Route   │ │   Handlers)   │ │ pub/sub │  - Encrypted Hypercore blob    │
│  │ Handlers)│ └───────────────┘ │         │    relaying (fallback only)    │
│  └──────────┘ ┌───────────────┐ │         │  - Stateless across instances  │
│  ┌──────────┐ │  Admin        │ │         │                                │
│  │Telemetry │ │  (Route       │ │         └────────────┬───────────────────┘
│  │(opt-in)  │ │  Handlers)    │ │                      │
│  └──────────┘ └───────────────┘ │                      │
└──────────────┬───────────────────┘                      │
               │                                          │
               ▼                                          ▼
     ┌───────────────────┐                      ┌───────────────────┐
     │  Postgres (Neon)   │◄─────────────────────│  (session/audit    │
     │  Redis (Upstash)   │                      │   metadata only)   │
     └───────────────────┘                      └───────────────────┘
```

### 5.2 Sequence Diagram — Critical Flow 1: P2P Match Event Sync (Happy Path, No Backend Needed)

```
Referee Device                 Hyperswarm/DHT (local)              Coach Device
     │                                  │                                │
     │  1. Log "Goal" event             │                                │
     │──append to local Hypercore log──►│                                │
     │                                  │                                │
     │  2. Broadcast discovery beacon   │                                │
     │─────────────────────────────────►│  3. Peer discovered via        │
     │                                  │     local network / DHT        │
     │                                  │───────────────────────────────►│
     │                                  │                                │
     │  4. Direct P2P connection established (Hyperswarm)                │
     │◄──────────────────────────────────────────────────────────────────►│
     │                                  │                                │
     │  5. Hypercore replicates new blocks (encrypted stream)             │
     │─────────────────────────────────────────────────────────────────►│
     │                                  │  6. Autobase merges into local  │
     │                                  │     causal view                │
     │                                  │  7. UI updates: score changes   │
     │                                  │     within <1s                 │
```

### 5.3 Sequence Diagram — Critical Flow 2: Relay-Assisted Sync (Devices Behind Restrictive NAT, Internet Available)

```
Device A (NAT'd)          Relay Service (standalone WS)        Device B (NAT'd)
     │                                │                                    │
     │ 1. Direct Hyperswarm connect attempt fails (symmetric NAT)          │
     │───────────────X                │                                    │
     │                                │                                    │
     │ 2. WebSocket connect + signed DID challenge-response auth           │
     │───────────────────────────────►│                                    │
     │                                │◄───────────────────────────────────│
     │                                │  3. Both peers register interest   │
     │                                │     in the same swarm topic        │
     │  4. Relay exchanges connection candidates (Protobuf signaling msgs) │
     │◄───────────────────────────────┼───────────────────────────────────►│
     │                                │                                    │
     │ 5. Hole-punch attempt using exchanged candidates                    │
     │◄─────────────────────────────────────────────────────────────────►│
     │        (if successful, Relay steps out; traffic goes P2P)           │
     │        (if unsuccessful, Relay forwards encrypted Hypercore          │
     │         replication traffic as a TURN-style fallback — Relay        │
     │         never decrypts payload content)                             │
```

**Note:** The Relay service never has plaintext access to replicated club/match data — it forwards encrypted Hypercore blocks or brokers connection metadata only. This preserves the "non-authoritative, no custody of user data" property even in the fallback path. It is also why the Relay service can run as a minimal, mostly stateless process: it holds session/signaling state, not user data.

### 5.4 Sequence Diagram — Critical Flow 3: Wallet Payment (Tournament Entry Fee)

```
Player Device (WDK)                                    Club/Tournament Wallet (WDK)
     │                                                              │
     │ 1. User initiates "Pay entry fee" (5 USD₮)                   │
     │ 2. WDK constructs + signs transaction locally (private key   │
     │    never leaves device)                                      │
     │                                                              │
     │ 3. Signed tx broadcast to settlement network (direct, no     │
     │    PitchOS backend involved)                                 │
     │─────────────────────────────────────────────────────────────►│
     │                                                              │
     │ 4. Settlement network confirms transaction                   │
     │◄─────────────────────────────────────────────────────────────│
     │                                                              │
     │ 5. Confirmation event appended to shared Hypercore tournament │
     │    log (registration marked "paid"), replicated P2P to all    │
     │    organizer/participant devices                              │
```

### 5.5 Deployment Diagram

```
                                  Internet
                                     │
                     ┌───────────────┴───────────────┐
                     │      Global Edge / CDN          │
                     │      (Vercel Edge Network)      │
                     └───────────────┬───────────────┘
                                     │
                     ┌───────────────▼───────────────┐
                     │   Next.js App (Vercel)         │
                     │   Public Gateway / Notif /     │
                     │   Telemetry / Admin             │
                     │   (serverless + edge functions) │
                     └───────────────┬───────────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                     │
        ┌───────▼───────┐    ┌───────▼───────┐     ┌───────▼───────┐
        │ Postgres        │    │ Redis          │     │ Object storage │
        │ (Neon, primary  │    │ (Upstash)      │     │ (S3-compatible,│
        │  + read replica)│    │                │     │  static assets)│
        └────────┬────────┘    └───────┬────────┘     └────────────────┘
                 │                     │
                 │            ┌────────▼────────┐
                 │            │  Relay Service   │
                 └───────────►│  (Fly.io         │
                              │   Machines,       │
                              │   multi-region:    │
                              │   US / EU / APAC)  │
                              └────────┬────────┘
                                       │
                          Hole-punch or TURN-style
                          fallback (Protobuf over WS)
                                       │
                     ┌─────────────────┴─────────────────┐
                     │        Client devices                │
                     │  (browsers/PWA, nearest Relay region)│
                     └───────────────────────────────────┘
```

---

## 6. Data Modeling and Storage Strategy

### 6.1 Two Distinct Data Domains

**Domain A — User/Club Data (authoritative on-device, replicated P2P)**
Clubs, rosters, matches, chat, prediction circles, AI outputs, wallet transaction history (as observed by the user's own client).

**Domain B — Supporting Services Data (authoritative in Postgres)**
Public tournament directory listings, push notification subscriptions, opt-in aggregate telemetry, admin/support records, Relay session/audit metadata. This is operational metadata about the system, not the club's private data.

### 6.2 Domain A: Hypercore/Autobase Schema (Conceptual)

```
ClubLog (Autobase, writers = club Admins/Coaches)
 ├─ ClubProfile        { id, name, crest_uri, location, ageCategory, createdAt }
 ├─ Member             { id, did, role, joinedAt, invitedBy }
 ├─ Roster Entry       { id, playerId, name, position, jerseyNumber,
 │                        guardianDid (if minor), consentFlags }
 ├─ TrainingSession    { id, date, location, attendees[] }
 ├─ Announcement       { id, authorDid, body, createdAt, readReceipts[] }
 └─ MatchRef           { id, matchLogId }   -- pointer to a separate MatchLog

MatchLog (Autobase, writers = referee(s)/coach(es) for that match)
 ├─ MatchMeta          { id, teams[], startedAt, format }
 ├─ Event              { id, type[goal|card|sub|possession], minute,
 │                        playerId, causalClock }
 └─ FinalResult        { score, ratingsByPlayer[] }

PredictionPoolLog (Autobase, writers = organizer; readers = participants)
 ├─ PoolMeta           { id, name, mode[points|real-money], entryFee,
 │                        maxParticipants, targetPool }
 ├─ Prediction         { id, participantDid, marketType, selection,
 │                        submittedAt, signedTxRef (if real-money) }
 └─ Resolution         { finalResult, payoutsByDid[] }
```

* Every record is signed by its author's DID-derived key, giving tamper-evidence independent of any server.
* Autobase's causal linearization gives a deterministic global ordering per log even with concurrent multi-device writes (e.g., two assistant referees both logging events).

### 6.3 Domain B: Postgres Schema (Supporting Services)

```sql
-- Public tournament directory (read-only mirror, organizer-published)
CREATE TABLE public_tournaments (
  id UUID PRIMARY KEY,
  club_did TEXT NOT NULL,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  region TEXT,
  starts_at TIMESTAMPTZ,
  published_snapshot JSONB NOT NULL,  -- denormalized, organizer-signed snapshot
  signature TEXT NOT NULL,            -- verifies snapshot came from club_did
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Push notification subscriptions
CREATE TABLE notification_subscriptions (
  id UUID PRIMARY KEY,
  device_did TEXT NOT NULL,
  push_token TEXT NOT NULL,
  topic TEXT NOT NULL,          -- e.g. "club:{id}", "tournament:{id}"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Opt-in aggregate telemetry (no PII, no club/player identifiers)
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  app_version TEXT,
  anonymized_session_id UUID,   -- rotated, not linkable to DID
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- Relay session/audit metadata (no payload content, ever)
CREATE TABLE relay_sessions (
  id UUID PRIMARY KEY,
  session_id TEXT NOT NULL,
  from_did TEXT NOT NULL,
  to_did TEXT NOT NULL,
  outcome TEXT NOT NULL,          -- 'hole_punch_success' | 'turn_fallback' | 'failed'
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);
```

**Key design point:** `public_tournaments.published_snapshot` is a signed, organizer-published snapshot — the backend stores it for discoverability/caching but is not the source of truth; a device can always re-verify the signature against the club's DID and reject a tampered or stale snapshot.

### 6.3a Row Level Security (RLS) Policies

Supabase RLS enforces authorization at the database layer, independent of application logic — defense-in-depth. The following RLS policies are enabled on each table:

**notification_subscriptions:**
```sql
-- A device can only view/modify its own subscriptions
CREATE POLICY "device_can_manage_own_subscriptions"
  ON notification_subscriptions
  FOR ALL
  USING (device_did = auth.jwt() ->> 'sub')
  WITH CHECK (device_did = auth.jwt() ->> 'sub');

-- Admins can read all subscriptions for support/debugging
CREATE POLICY "admin_can_read_all_subscriptions"
  ON notification_subscriptions
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```

**telemetry_events:**
```sql
-- Anyone can insert (opt-in telemetry), but cannot read/modify
CREATE POLICY "append_only_telemetry"
  ON telemetry_events
  FOR INSERT
  WITH CHECK (true);

-- Admins can aggregate/read for analytics
CREATE POLICY "admin_can_read_telemetry"
  ON telemetry_events
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```

**relay_sessions:**
```sql
-- Relay service (service role with special JWT) writes session metadata
-- Application code cannot write/read this table directly; only via the Relay service's authenticated endpoint
CREATE POLICY "relay_service_can_write_sessions"
  ON relay_sessions
  FOR INSERT
  USING (auth.jwt() ->> 'role' = 'relay_service');

CREATE POLICY "admin_can_read_relay_sessions"
  ON relay_sessions
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```

**public_tournaments:**
```sql
-- Everyone can read (public-facing)
CREATE POLICY "public_read"
  ON public_tournaments
  FOR SELECT
  USING (true);

-- Only the organizing club's members can insert/update
-- (enforced by JOIN to a club_members table or via application logic + RLS)
CREATE POLICY "organizer_can_manage"
  ON public_tournaments
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' IN (
    SELECT did FROM club_members WHERE club_id = public_tournaments.club_did
  ));
```

**Key points:**
* `auth.jwt() ->> 'sub'` extracts the DID from the JWT claim (set by the custom-auth flow on the client).
* `auth.jwt() ->> 'role'` is a custom claim the backend includes in the JWT to differentiate device users from admins vs. the Relay service (which has its own privileged service role).
* RLS is always enabled in production; in local dev, RLS can be toggled off via Supabase's dashboard for faster iteration.
* RLS policies are defined in migrations alongside the table definitions, so they version-control and migrate with the schema.

### 6.4 Data Lifecycle

| Data | Creation | Update | Retention | Deletion |
|---|---|---|---|---|
| Club/roster/match logs (Domain A) | On-device, on user action | Append-only (Hypercore); logical updates via new records, not mutation | Indefinite, user-controlled | User/club-initiated local purge; no backend copy to delete |
| Public tournament snapshots (Domain B) | Organizer publishes via signed action | Organizer republishes to update | 90 days post tournament end, then archived | Automatic archival job; organizer can request early removal |
| Telemetry events (Domain B) | Opt-in only | Immutable | 180 days | Automatic rolling deletion |
| Relay session metadata (Domain B) | Per signaling session | N/A | 30 days | Automatic rolling deletion |
| Notification subscriptions | On subscribe | Token refresh | Until unsubscribed or 30 days inactive | Automatic cleanup job |

### 6.5 Backup / Restore

* **Domain A (on-device):** PitchOS provides an explicit **encrypted export** feature (a `.pitchos-backup` file containing the Hypercore log, encrypted with a user-chosen passphrase) so a club admin can restore club state onto a new device or recover after data loss. This is the primary backup mechanism, by design — there is no server-side copy to restore from.
* **Domain B (Postgres):** Standard managed-database backups — automated daily snapshots + point-in-time recovery (WAL archiving), retained 30 days. Since this data is regenerable/non-authoritative, RPO/RTO targets are relaxed relative to a typical production database (see Section 8.4).

### 6.6 Migration Plan

* **Domain A:** Hypercore log schemas are versioned via a `schemaVersion` field on each record type; the client applies forward-compatible migrations in-memory when reading older records (never rewriting historical log entries, preserving the append-only integrity guarantee).
* **Domain B:** Standard Postgres migrations via Prisma Migrate, run as a CI/CD gated step before new application code is deployed (both the Next.js app and Relay service read from the same schema, so migrations are coordinated through a single shared migration package), with a documented rollback migration for every forward migration.

---

## 7. Security and Compliance

### 7.1 Authentication / Authorization

* **Identity:** Every user's identity is a DID derived from their WDK keypair. There is no separate PitchOS username/password.
* **Authentication to Supporting Services:** Signed challenge-response — the client requests a nonce, signs it with the private key, and the Next.js app / Relay service verifies the signature against the public key/DID. Sessions use short-lived JWTs (15 min) issued after successful challenge verification, refreshed via the same signing mechanism. Both deployables validate the same JWT format using a shared `packages/shared-types` verification utility, so auth logic isn't duplicated/drifted between them.
* **Authorization within Client-Local Core:** Role-based (Owner/Admin/Coach/Player/Parent/Volunteer) enforced at the application layer when rendering/mutating Hypercore records; additionally, Autobase write access can be restricted at the protocol level by controlling which DIDs are accepted as writers to a given log.
* **Authorization within Supporting Services:** Standard RBAC for the Admin route group (internal staff only, IP-allowlisted); Public Gateway endpoints are read-only and unauthenticated by design (public tournament pages), rate-limited via Redis to prevent abuse.

### 7.2 Data Protection

* **In transit:** TLS 1.3 for all Supporting Services HTTP/WebSocket traffic; Hypercore's native stream encryption (based on the Noise Protocol Framework) for all P2P replication traffic.
* **At rest (device):** Reliance on OS-level disk encryption; sensitive local data (wallet seed) additionally encrypted with a user-derived key (passphrase or platform secure enclave where available, e.g., WebAuthn-backed key wrapping).
* **At rest (backend):** Postgres encryption-at-rest via the managed provider; no sensitive user PII stored — the schema (Section 6.3) is deliberately designed to avoid storing anything that would make the backend a high-value target.

### 7.3 OWASP Considerations (Top 10, applied)

| OWASP Risk | Mitigation |
|---|---|
| Broken Access Control | RBAC enforced server-side in every Route Handler and in the Relay service's session authorization; DID-based auth checked on every mutating endpoint |
| Cryptographic Failures | No custom crypto — rely on WDK/Hypercore's audited primitives (Noise Protocol, standard signature schemes); TLS 1.3 everywhere |
| Injection | Parameterized queries only (Prisma query builder), no raw SQL string concatenation |
| Insecure Design | Threat-modeled explicitly for the "backend as non-authoritative" property — every Domain B write that mirrors Domain A data requires signature verification against the originating DID |
| Security Misconfiguration | Infra-as-code (Terraform) with peer-reviewed changes; no manual console changes to prod; Vercel/Fly.io environment variables managed via a secrets manager, not dashboard-pasted |
| Vulnerable Components | Automated dependency scanning (Dependabot/Snyk) in CI; Trivy image scanning for the Relay service before deploy |
| Identification/Auth Failures | Short-lived JWTs, signature-based challenge-response, no long-lived static credentials |
| Software/Data Integrity Failures | Signed CI artifacts; Domain A records are cryptographically signed end-to-end, giving tamper-evidence even without a trusted server |
| Logging/Monitoring Failures | Structured audit logging (Section 7.4) plus alerting on anomalous patterns (e.g., relay abuse, repeated auth failures) |
| SSRF | Public Gateway never fetches arbitrary user-supplied URLs server-side; any preview/thumbnail generation uses an allowlist |

### 7.4 Audit Logging

* Every mutating action in Supporting Services (tournament publish/unpublish, admin action, subscription change) is written to an append-only `audit_log` table: `{ actor_did, action, resource, before, after, timestamp, ip_hash }`.
* Client-side, every write to a Hypercore log is inherently audit-logged by virtue of being a signed, append-only record — this is a structural advantage of the architecture and should be highlighted in the hackathon presentation.
* Audit logs are retained for 1 year (Domain B) and are immutable once written (no update/delete grants on that table for the application role).

### 7.5 Compliance Notes

* **Minors' data:** No Domain B table stores player names, ages, or identifiable minor data. All such data lives exclusively in Domain A (on-device, P2P), consistent with a data-minimization posture toward regulations like COPPA/GDPR-K.
* **Real-money prediction pools:** Where enabled, transactions are direct wallet-to-wallet (WDK) — PitchOS Supporting Services never custody funds and never process real-money settlement server-side, reducing (though not eliminating — organizers still bear jurisdictional responsibility) regulatory exposure for the platform.

---

## 8. Operational Requirements

### 8.1 Monitoring

* **Metrics (Prometheus, via OpenTelemetry):** request rate/latency/error-rate per Next.js API route (RED metrics), Relay session counts and hole-punch success rate, WebSocket connection counts, Redis Streams consumer lag.
* **Client-side telemetry (opt-in only):** aggregate, anonymized metrics such as "AI response time distribution," "sync latency distribution," crash rates — explicitly never including club/player/match content.

### 8.2 Alerting

| Alert | Condition | Severity |
|---|---|---|
| Relay hole-punch success rate drop | < 80% success over 15 min | High |
| Next.js API error rate | > 2% 5xx over 5 min | High |
| Postgres replication lag | > 30s | Medium |
| Redis memory pressure | > 80% used | Medium |
| Notification delivery failure rate | > 10% over 1 hour | Medium |
| Certificate expiry | < 14 days remaining | Low (ticket, not page) |

* Alerting routed via Grafana Alerting → PagerDuty/Opsgenie for High severity, Slack channel for Medium/Low.

### 8.3 Logging

* Structured JSON logs (via `pino`) shipped to Loki from both the Next.js app and Relay service, correlated with OpenTelemetry trace IDs so a single request can be followed across the Gateway → Relay → Redis path even though they're separate deployables.
* No Domain A content ever appears in Supporting Services logs (enforced via a lint rule/log-scrubbing middleware that redacts any field resembling club/player content).

### 8.4 SRE Practices / Disaster Recovery

Because Supporting Services are explicitly non-authoritative for user data, DR posture is deliberately lighter-weight than a typical production system, but not absent:

| Scenario | Recovery Approach | RTO | RPO |
|---|---|---|---|
| Full Supporting Services outage (both deployables down) | Client-Local Core continues operating fully offline/P2P; Relay-dependent flows (cross-network sync) degrade to "local network only" until restored | N/A for core product; target 1 hour to restore Supporting Services | N/A (no authoritative data lost) |
| Next.js app outage only (Relay still up) | P2P sync/relay unaffected; only public pages/notifications/telemetry degrade | Vercel-managed, typically minutes | N/A |
| Relay service outage only (Next.js app still up) | Devices fall back to direct Hyperswarm/DHT only — cross-NAT sync degrades but local-network sync is unaffected | Target 15 min (Fly.io instance restart / failover region) | N/A |
| Postgres primary failure | Automatic failover to standby (managed provider) | 5 minutes | 5 minutes (via continuous WAL) |
| Region outage (Relay) | Traffic reroutes to nearest healthy region via DNS/health checks | < 2 minutes | N/A (stateless) |
| Complete data center loss (worst case) | Restore Postgres from latest snapshot; public tournament listings are regenerable from organizer devices re-publishing | 4 hours | 24 hours |

### 8.5 Incident Response

* On-call rotation (even at small team size) with a documented runbook per alert type, per deployable.
* Severity classification: **SEV-1** (Supporting Services fully down — degrades but does not break core product), **SEV-2** (single deployable/module degraded), **SEV-3** (non-urgent).
* Post-incident: blameless postmortem within 5 business days for SEV-1/SEV-2, logged in the decision log (Section 11.3) if it results in an architecture change.

---

## 9. Integration and Interface Design

### 9.1 External Services

| Service | Purpose | Integration Type |
|---|---|---|
| QVAC | On-device AI inference | Local SDK/runtime embedded in client, no network API |
| WDK | Wallet, signing, settlement | Local SDK embedded in client; settlement network calls go direct from client, not proxied through PitchOS backend |
| Firebase Cloud Messaging | Push notification delivery | Server-to-FCM REST API from the Next.js Notifications route group |
| Object storage (S3-compatible) | Static asset hosting (club crests, exported reports) | Standard S3 API, pre-signed URLs issued by the Public Gateway route group |

### 9.2 API Contracts

* **Style:** OpenAPI 3.1 spec maintained in-repo (`apps/next-app/openapi.yaml`), generated client types consumed by the Client-Local Core for any Supporting Services calls (public gateway browsing, notification subscription management).
* **Example endpoint (Public Gateway):**

```yaml
/api/gateway/tournaments/{id}:
  get:
    summary: Fetch a public, read-only tournament snapshot
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                id: { type: string, format: uuid }
                name: { type: string }
                clubDid: { type: string }
                snapshot: { type: object }       # organizer-signed payload
                signature: { type: string }
                updatedAt: { type: string, format: date-time }
```

* **Relay signaling protocol:** defined in Protobuf (`relay.proto`) rather than JSON, since this channel is high-frequency and latency-sensitive, and shared via `packages/shared-types` so both the client and Relay service compile from the same schema:

```protobuf
syntax = "proto3";
package pitchos.relay;

message SignalMessage {
  string session_id = 1;
  string from_did = 2;
  string to_did = 3;
  bytes payload = 4;       // ICE-style candidate or encrypted Hypercore chunk
  int64 timestamp = 5;
  int32 protocol_version = 6;
}
```

### 9.3 Versioning

* **Public Gateway / Notifications / Admin REST API:** URI-based versioning (`/api/v1/...`); breaking changes require a new version path, with the previous version supported for a minimum 6-month deprecation window.
* **Relay signaling protocol:** Protobuf field numbering discipline (never reuse/renumber fields); the `protocol_version` field allows the Relay service to reject or gracefully degrade for incompatible client versions.
* **Domain A record schemas:** `schemaVersion` field per record type (Section 6.6); clients must support reading at least the last 2 major schema versions to accommodate devices that haven't updated yet in a P2P swarm.

---

## 10. Roadmap and Phased Implementation

### 10.1 MVP (Hackathon Deadline: July 8)

* Client-Local Core: club creation, roster, local AI Q&A, Live Match Center over Pears, single-format tournament bracket, WDK wallet, entry-fee payments, points-mode prediction circles.
* Supporting Services: **Relay service only** (minimum needed to demonstrate cross-network sync reliably during judging), deployed to a single Fly.io region. Next.js Supporting Services app (Public Gateway, Notifications, Telemetry, Admin) deferred to Phase 2.
* Deployment: single-region Relay, no multi-region yet; Next.js app not yet needed for MVP demo.

### 10.2 Phase 2 (July 12)

* Stand up the Next.js Supporting Services app: Public Gateway module (shareable tournament pages) and Notifications module first.
* Introduce a second Relay region (US + one additional region) to validate the deployment diagram in Section 5.5 at small scale.
* Begin opt-in Telemetry module (aggregate-only) to inform Phase 3 prioritization.

### 10.3 Final Phase (July 14) / Post-Hackathon

* Admin route group for support operations, IP-allowlisted.
* Full observability stack (Grafana/Loki/Tempo) stood up in production, not just staging.
* Security review / lightweight external audit before any real-money prediction pool is enabled by default for any organizer.
* Revisit whether Telemetry needs to be pulled out of the Next.js app into its own deployable if volume grows (the one plausible future extraction, per the module-boundary design in Section 4.3).

### 10.4 Risks and Mitigations (Architecture-Specific)

| Risk | Impact | Mitigation |
|---|---|---|
| Hyperswarm/DHT connectivity proves unreliable across the diverse network conditions judges/users will have | Sync fails to demo well, core value prop undermined | Relay service built and tested first, before polish features; rehearse demo across multiple real-world networks, not just localhost |
| Relay service (WebSocket, always-on) has a different operational profile than the rest of the team is used to (mostly Next.js/serverless experience) | Slower ramp-up, potential reliability gaps in the one component that can't just "redeploy and retry" | Keep the Relay service intentionally minimal (signaling + fallback relay only, no business logic); assign it to whichever engineer has the most Node/WebSocket experience; load-test early |
| Folder-by-domain boundaries in the Next.js app erode over time (routes start reaching into each other's data access code) | Loses the clean extraction path, technical debt | Enforce via `dependency-cruiser` rule in CI that fails the build on cross-domain internal imports |
| Public Gateway becomes a de facto authoritative data store by convenience (developers start reading from Postgres instead of verifying signed snapshots) | Undermines the "non-authoritative backend" security property | Code review checklist item + architectural decision record (ADR) explicitly prohibiting this pattern |
| Relay service becomes a scaling bottleneck faster than anticipated (e.g., a large multi-region tournament) | Degraded cross-network sync latency | Design Relay as stateless-per-connection from day one (Section 4.2/5.5) so horizontal autoscaling on Fly.io is a config change, not a rewrite |
| Telemetry scope creep re-introduces PII collection informally | Compliance risk, erodes user trust | Schema-level enforcement (Section 6.3) — no free-text or identifier fields in `telemetry_events`; reviewed at each PR touching that route group |

---

## 11. Appendices

### 11.1 Glossary

| Term | Definition |
|---|---|
| **Autobase** | A protocol built on Hypercore that merges multiple independent append-only logs (from different writers/devices) into a single, causally-ordered view. |
| **Domain A / Domain B** | This document's shorthand for, respectively, authoritative on-device/P2P data and non-authoritative Supporting Services data. |
| **DID** | Decentralized Identifier — a self-sovereign identity string derived from a cryptographic keypair, not issued by a central authority. |
| **Hypercore** | An append-only, cryptographically-verifiable log — the core data structure underlying Pears-based P2P replication. |
| **Hyperswarm** | A DHT-based peer discovery and connection library used to find and connect to other peers interested in the same topic/log. |
| **NAT traversal** | Techniques (hole-punching, relay/TURN fallback) that allow two devices behind separate routers/firewalls to establish a direct connection. |
| **QVAC** | Tether's on-device AI runtime/stack used for local inference (coaching, analysis, translation, commentary). |
| **Self-custodial wallet** | A wallet where the private key is generated and held exclusively by the end user's device; no third party can move funds on the user's behalf. |
| **WDK** | Wallet Development Kit — Tether's SDK for building self-custodial wallet functionality into applications. |

### 11.2 References

* Hypercore Protocol documentation (Holepunch)
* Autobase documentation (Holepunch)
* Hyperswarm documentation (Holepunch)
* Pear runtime documentation (Holepunch)
* OWASP Top 10 (2021/2025 revisions)
* NIST guidance on key management for self-custodial systems
* PitchOS PRD v2.0 (companion product document)

### 11.3 Decision Log (ADR-style)

| ID | Decision | Rationale | Status |
|---|---|---|---|
| ADR-001 | Split Supporting Services into two deployables: a Next.js app for request/response modules and a standalone Node/WebSocket Relay service | Runtime shape mismatch — Relay needs persistent connections, which Vercel/serverless can't host; forcing everything into one framework would either lose edge-deployment simplicity or misfit the Relay workload | Accepted |
| ADR-002 | Enforce module boundaries in the Next.js app via folder-by-domain structure + `dependency-cruiser`, rather than a DI framework | Next.js Route Handlers don't provide NestJS-style module boundaries natively; a lint-enforced dependency graph achieves the same discipline without adopting a heavier framework | Accepted |
| ADR-003 | Supporting Services (both deployables) hold no authoritative copy of club/player/match/wallet data | Core to the offline-first, privacy-preserving product thesis; reduces compliance and security surface area | Accepted |
| ADR-004 | Use DID/signature-based auth instead of username/password, shared across both deployables via a common verification utility | Consistent with self-sovereign identity model already required by WDK; avoids a credential store as an attack target; avoids auth-logic drift between the two deployables | Accepted |
| ADR-005 | Use Protobuf for Relay signaling, JSON for public REST APIs | Signaling is high-frequency/latency-sensitive (Protobuf's compact binary format helps); public APIs prioritize debuggability/low volume (JSON is fine) | Accepted |
| ADR-006 | Defer OpenSearch/Elasticsearch until proven necessary; use Postgres full-text search at MVP/Phase 2 | Avoids operating a search cluster before there's demonstrated query volume/complexity that Postgres FTS can't handle | Accepted |
| ADR-007 | Real-money prediction pools default OFF; points-only is the default mode | Regulatory risk varies by jurisdiction; platform avoids becoming a custodial party to real-money settlement | Accepted |
| ADR-008 (supersedes v1.0 ADR-001) | Do not adopt a NestJS modular monolith | The client is already Next.js; a second framework (NestJS) for the backend adds team overhead without solving a problem folder-by-domain + lint rules don't already solve for the request/response modules. NestJS's main advantage (native WebSocket gateway support) is only needed by the Relay service, which is deliberately kept separate and minimal regardless of framework choice | Accepted |
