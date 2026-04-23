# SEAHORSE — KOOMPI AI Agent

> Your business, always on. · ជំនួយការអាជីវកម្មរបស់អ្នក


## What Is Seahorse?

Seahorse is KOOMPI's open-source AI agent for business owners. It runs on the channels businesses already use — Telegram, Facebook, WhatsApp, Discord — and handles daily operations autonomously: taking orders, posting content, tracking inventory, reporting sales, communicating with staff and customers in Khmer and English.

It is not a chatbot. It is not a dashboard. It is an agent that works.


## The Problem

70M+ SMEs across Southeast Asia run their operations inside messaging apps. A restaurant owner manages orders on Telegram, posts menus on Facebook, coordinates staff on WhatsApp — manually, every day. There is no AI agent built for this reality. Generic AI assistants don't know Khmer. SaaS dashboards require training nobody has time for.

Seahorse meets business owners where they already are.


## Strategic Position

| Layer | What |
| - | - |
| **Open source** | Seahorse runtime, channel integrations, skill packs, Khmer language tools — MIT licensed, self-hostable |
| **KOOMPI Cloud** | Managed hosting, fine-tuned Khmer models, multi-tenant infrastructure, analytics, SLA |
| **KOOMPI Mini** | Hardware-bundled deployment — plug in, works immediately, data stays local |


The moat is not the code. It is the Khmer business data that accumulates on KOOMPI Cloud and makes the hosted agent smarter than any self-hosted alternative over time.


## Architecture

### Runtime Layer

Seahorse uses **OpenClaw** as its channel and runtime foundation (MIT). OpenClaw is a dependency, not a fork — upstream updates (new channels, security patches, model support) are absorbed with `bun update openclaw`. Seahorse's business logic is never entangled with OpenClaw's core.

### Seahorse Packages (KOOMPI IP)

Built from scratch, MIT licensed, inspired by TinyClaw's architecture patterns (not its code):

```
packages/  
  core/           Agent bootstrap, config, session management  
  memory/         Temporal memory with episodic decay  
                  (agent learns what matters per business over time)  
  delegation/     Multi-agent orchestration for complex workflows  
                  (sub-agents handle parallel tasks: post + record + notify)  
  compactor/      4-layer context compaction  
                  (keeps long-running business sessions token-efficient)  
  router/         Smart provider routing — cheap models for simple queries,  
                  powerful models only when needed  
  khmer/          Khmer language layer  
                  - kiri-ocr (Apache 2.0) — read receipts, menus, documents  
                  - kiri-tts (Apache 2.0) — agent speaks in Khmer  
                  - Number → Khmer word conversion  
                  - Formal/informal register detection  
  identity/       Per-business context — who is the owner, staff, customers  
                  Channel role routing (staff vs customer vs owner intent)
```

### Skill Packs (Domain IP)

```
skills/  
  fnb/            F&B — menu, orders, daily report, food social posts  
  retail/         Retail — inventory, sales, WhatsApp ordering, restock alerts  
  education/      Education — lesson plans, parent comms, MoEYS curriculum  
  professional/   Professional — appointments, reminders, client records
```

### Channel Layer (OpenClaw)

Telegram · Facebook Messenger · WhatsApp · Discord · (extensible)


## Channel Role Design

Each channel has a natural role. Same agent brain, right register per surface:

| Channel | Primary Role |
| - | - |
| **Telegram** | Staff ops, order intake, internal alerts, owner queries |
| **Facebook** | Daily content posts, customer replies, promotions |
| **WhatsApp** | Customer orders, delivery coordination, follow-ups |
| **Discord** | Internal team communication, pipeline notifications |


### Identity + Context Routing

On first message per session, Seahorse resolves:

1. **Who** — owner, staff member, or customer

2. **Which context** — which business, which vertical, which skill pack

3. **Which register** — Khmer formal, Khmer casual, or English

This is the first non-trivial architecture problem to solve. It gates everything else.


## Vertical Rollout

One vertical must be *unnervingly good* before the next ships.

| Phase | Vertical | Core Loop |
| - | - | - |
| **v1** | F&B | Morning menu post → order intake → daily sales report |
| **v2** | Retail | Inventory tracking → WhatsApp orders → restock alerts |
| **v3** | Professional Services | Appointment booking → reminders → follow-up |
| **v4** | Education | Lesson plans → parent comms → attendance → MoEYS alignment |



## v1 Scope — F&B Only

The complete daily loop a restaurant/cafe owner gets on day one:

```
7:00am  Seahorse posts today's menu to Facebook + Telegram (Khmer caption, auto-generated)  
During  Customers order via WhatsApp/Telegram — Seahorse tracks every order  
5:00pm  Seahorse sends daily sales summary to owner (items sold, revenue, top dish)  
Weekly  Seahorse suggests which dishes to promote based on order history  
Always  Owner can ask in Khmer: "តើថ្ងៃនេះយើងលក់បានប៉ុន្មាន?" → instant answer
```

**v1 is done when:** A Phnom Penh cafe can run its daily digital operations entirely through Seahorse with zero manual steps.


## Khmer AI Stack

| Capability | Tool | License |
| - | - | - |
| OCR (read menus, receipts, docs) | `kiri-ocr` by mrrtmob | Apache 2.0 |
| TTS (agent speaks Khmer) | `kiri-tts-ft-16bit` by mrrtmob | Apache 2.0 |
| Voice cloning | kiri-tts zero-shot (30s reference) | Apache 2.0 |
| Multilingual reasoning | SeaLLMs (Khmer + regional) | Check per model |


Both models are used as dependencies. As KOOMPI Cloud accumulates real Khmer business data, these models will be fine-tuned on business-context corpora — making the managed service progressively smarter than the self-hosted version.


## Tech Stack

| Layer | Technology |
| - | - |
| Runtime | Bun |
| Language | TypeScript (strict) |
| Channel foundation | OpenClaw (MIT dependency) |
| Database | SQLite (local) / Postgres (KOOMPI Cloud) |
| Packaging | Bun workspaces (monorepo) |
| Linting | Biome |
| Khmer OCR | kiri-ocr (Python, pip) |
| Khmer TTS | kiri-tts (Python, pip) |
| Containerization | Docker (KOOMPI Mini + Cloud deploy) |



## Repo Structure

```
kosal/  
  KOSAL.md                  ← this document  
  CONTRIBUTING.md  
  CLA.md                    ← contributor license agreement (required)  
  LICENSE                   ← MIT  
  package.json              ← bun workspaces root  
  packages/  
    core/  
    memory/  
    delegation/  
    compactor/  
    router/  
    khmer/  
    identity/  
  skills/  
    fnb/  
    retail/  
    education/  
    professional/  
  src/  
    cli/                    ← kosal onboard, kosal start, kosal status  
    web/                    ← business owner dashboard (KOOMPI Cloud)  
  docs/  
  docker/  
    Dockerfile  
    docker-compose.yml
```


## KOOMPI Cloud vs Self-Hosted

|  | Self-Hosted | KOOMPI Cloud |
| - | - | - |
| Runtime | ✅ Full open source | ✅ Managed, auto-updated |
| Channels | ✅ All 4 | ✅ All 4 + future |
| Khmer models | ✅ kiri baseline | ✅ Fine-tuned on business data |
| Memory | ✅ Local SQLite | ✅ Multi-tenant, backed up |
| Analytics | ❌ | ✅ Business insights dashboard |
| Support | Community | SLA |
| Hardware option | Any server | KOOMPI Mini (plug-and-play) |
| Cost | Free | $X/mo subscription |



## Revenue Model

| Tier | Who | Price |
| - | - | - |
| **Starter** | Small cafe, shop | $X/mo — 1 business, 4 channels |
| **Professional** | Multi-location, team | $X/mo — multiple staff roles, analytics |
| **Enterprise** | Chains, government, large orgs | Custom — on-premise option, SLA |
| **KOOMPI Mini** | Any | Hardware one-time + Cloud subscription |



## Contributor Agreement

All contributors must sign a CLA before their first PR is merged. This ensures KOOMPI can operate Seahorse as a commercial managed service without GPL-style obligations affecting the cloud infrastructure. The open-source MIT license on the code itself is unaffected — contributors and users retain full rights to self-host.


## What Seahorse Is Not

- Not a generic AI assistant

- Not a SaaS dashboard that requires training

- Not English-only

- Not cloud-only (KOOMPI Mini is local-first)

- Not built for enterprise first — SME-first, enterprise later


## Name

**Kosal (គោសល)** — Khmer for *skillful, capable, proficient*. Also a Cambodian name. The agent should feel like a capable colleague, not a software product.


*This document is the source of truth for KOOMPI Seahorse. Update it when decisions change.*

