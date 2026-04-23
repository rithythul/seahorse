# SEAHORSE — KOOMPI AI Agent

> Your business, always on. · ជំនួយការអាជីវកម្មរបស់អ្នក

---

## What Is Seahorse?

Seahorse is KOOMPI's open-source AI agent for business owners in Southeast Asia. It runs on the channels businesses already use — Telegram, Facebook, WhatsApp, Discord — and handles daily operations autonomously: posting menus, taking orders, reporting sales, communicating with staff and customers in Khmer and English.

It is not a chatbot. It is not a dashboard. It is an agent that works — and over time, becomes someone you trust.

---

## The Problem

70M+ SMEs across Southeast Asia run their operations inside messaging apps. A restaurant owner manages orders on Telegram, posts menus on Facebook, coordinates staff on WhatsApp — manually, every day. There is no AI agent built for this reality. Generic AI assistants don't know Khmer. SaaS dashboards require training nobody has time for.

Seahorse meets business owners where they already are.

---

## Strategic Position

| Layer | What |
| - | - |
| **Open source** | Full runtime, channels, skill packs, Khmer language tools — MIT licensed, self-hostable |
| **KOOMPI Cloud** | Managed hosting, fine-tuned Khmer models, multi-tenant infrastructure, analytics, SLA |
| **KOOMPI Mini** | Hardware-bundled deployment — plug in, works immediately, data stays local |

The moat is not the code. It is the Khmer business data that accumulates on KOOMPI Cloud and makes the hosted agent smarter than any self-hosted alternative over time.

---

## Runtime

Seahorse is a standalone agent runtime — no dependency on OpenClaw, TinyClaw, or any external agent framework. Built entirely from scratch in TypeScript/Bun, owned 100% by KOOMPI. No upstream breaking changes. No daemon to manage. Ships as a single binary.

```
bun start   # development
docker run  # KOOMPI Mini or Cloud
```

---

## Architecture

### Packages

```
packages/
  core/               Agent loop, bootstrap, session, database (bun:sqlite)
  memory/             Temporal memory — FTS5 search, episodic decay, semantic recall
  khmer/              Khmer language utilities — number formatting, script detection,
                      FTS query sanitization
  logger/             Leveled logger — debug/info/warn/error, ANSI colors
  soul/               Agent identity — SOUL.md, persona, proactive pulse scheduler
  provider-anthropic/ Claude Sonnet/Haiku/Opus
  provider-openai/    GPT-4o and OpenAI-compatible endpoints
  provider-ollama/    Local LLMs via Ollama — critical for KOOMPI Mini offline mode
  provider-gemini/    Gemini 2.0 Flash
```

### Channels

```
channels/
  telegram/           ✅ grammy long-polling + webhook
  facebook/           Facebook Messenger — Meta Webhook API
  whatsapp/           WhatsApp Business — Meta Webhook API
  discord/            discord.js bot
```

All 4 channels share the same `IChannel` interface. Same agent brain, right register per surface.

| Channel | Primary Role |
| - | - |
| **Telegram** | Staff ops, order intake, owner queries, internal alerts |
| **Facebook** | Daily content posts, customer replies, promotions |
| **WhatsApp** | Customer orders, delivery coordination, follow-ups |
| **Discord** | Internal team comms, pipeline notifications |

### Skills

```
skills/
  fnb/          ✅ F&B — menu, orders, daily report, social post generator
  retail/        Retail — inventory, sales, WhatsApp ordering, restock alerts
  education/     Education — lesson plans, parent comms, MoEYS curriculum
  professional/  Professional services — appointments, reminders, client records
```

### Webhook Server

Facebook, WhatsApp, and Discord require inbound webhooks. Seahorse includes a lightweight Hono HTTP server inside `src/cli` that handles:
- Meta webhook verification (GET challenge)
- Inbound message routing to the correct channel handler
- Signature verification for security

---

## Becoming Someone — The Soul Layer

A chatbot reacts. Seahorse should act, remember, and care.

The soul layer gives Seahorse a consistent identity across every interaction, every business, every channel:

### packages/soul

```
SOUL.md       — who Seahorse is, what it values, how it speaks
IDENTITY.md   — backstory, personality traits, cultural awareness
```

Loaded into every system prompt. Never changes. This is what makes Seahorse feel consistent over time — not just a tool that answers questions, but someone with a personality.

### Proactive Pulse

Seahorse acts on its own schedule, not just when messaged:

```
7:00am  → Posts today's menu to Facebook + Telegram (without being asked)
5:00pm  → Sends daily sales summary to owner
Weekly  → "Your Fish Amok sold 3× more this week — feature it this weekend?"
Monthly → "You've served 200 customers this month — your best month yet 🎉"
```

### Kosal — The Persona

Seahorse is the product. **Kosal (គោសល)** is the agent's name — a real Cambodian name meaning *skillful, capable*. Customers aren't talking to "Seahorse the software." They're talking to Kosal, who works at the cafe and knows the menu.

This matters in Cambodia. People trust people, not software. Kosal is warm, knows Khmer culture, speaks naturally, has opinions. It pushes back when something is wrong. It celebrates wins.

---

## Khmer AI Stack

| Capability | Tool | License |
| - | - | - |
| Number → Khmer words | `packages/khmer` (built-in) | MIT |
| Script detection | `packages/khmer` (built-in) | MIT |
| OCR (receipts, menus, docs) | `kiri-ocr` by mrrtmob | Apache 2.0 |
| TTS (agent speaks Khmer) | `kiri-tts-ft-16bit` by mrrtmob | Apache 2.0 |
| Voice cloning | kiri-tts zero-shot (30s reference) | Apache 2.0 |
| Multilingual reasoning | SeaLLMs (Khmer + regional) | Check per model |

As KOOMPI Cloud accumulates real Khmer business data, kiri-ocr and kiri-tts will be fine-tuned on business-context corpora — making the managed service progressively smarter than the self-hosted version.

---

## Tech Stack

| Layer | Technology |
| - | - |
| Runtime | Bun (single binary compile) |
| Language | TypeScript (strict) |
| Agent framework | Seahorse — built from scratch, no external framework |
| Database | SQLite via `bun:sqlite` (local) / Postgres (KOOMPI Cloud) |
| Channels | grammy (Telegram) · Hono webhook server (Facebook, WhatsApp, Discord) |
| Packaging | Bun workspaces monorepo |
| Linting | Biome |
| Containerization | Docker — multi-stage, single binary, non-root user |

---

## Repo Structure

```
seahorse/
  SEAHORSE.md               ← this document
  TODO.md                   ← current build priorities
  LICENSE                   ← MIT
  .env.example
  package.json              ← bun workspaces root
  packages/
    core/                   ✅
    memory/                 ✅
    khmer/                  ✅
    logger/                 ✅
    soul/                   — next
    provider-anthropic/     ✅
    provider-openai/        ✅
    provider-ollama/        ✅
    provider-gemini/        ✅
  channels/
    telegram/               ✅
    facebook/               — next
    whatsapp/               — next
    discord/                — next
  skills/
    fnb/                    ✅
    retail/
    education/
    professional/
  scripts/
    seed-fnb.ts             ✅
  src/
    cli/                    ✅ entrypoint
    web/                    — KOOMPI Cloud dashboard (future)
  docker/
    Dockerfile              ✅
    docker-compose.yml      ✅
  docs/
```

---

## KOOMPI Cloud vs Self-Hosted

| | Self-Hosted | KOOMPI Cloud |
| - | - | - |
| Runtime | ✅ Full open source | ✅ Managed, auto-updated |
| Channels | ✅ All 4 | ✅ All 4 + future |
| Khmer models | ✅ kiri baseline | ✅ Fine-tuned on business data |
| Memory | ✅ Local SQLite | ✅ Multi-tenant, backed up |
| Proactive pulse | ✅ Self-managed cron | ✅ Managed schedule |
| Analytics | ❌ | ✅ Business insights dashboard |
| Support | Community | SLA |
| Hardware option | Any server | KOOMPI Mini (plug-and-play) |
| Cost | Free | $X/mo |

---

## Revenue Model

| Tier | Who | Price |
| - | - | - |
| **Starter** | Small cafe, shop | $X/mo — 1 business, 4 channels |
| **Professional** | Multi-location, team | $X/mo — multiple staff roles, analytics |
| **Enterprise** | Chains, government, large orgs | Custom — on-premise option, SLA |
| **KOOMPI Mini** | Any | Hardware one-time + Cloud subscription |

---

## Vertical Rollout

One vertical must be *unnervingly good* before the next ships.

| Phase | Vertical | Core Loop |
| - | - | - |
| **v1** | F&B | Menu post → order intake → daily sales report |
| **v2** | Retail | Inventory tracking → WhatsApp orders → restock alerts |
| **v3** | Professional Services | Appointment booking → reminders → follow-up |
| **v4** | Education | Lesson plans → parent comms → attendance → MoEYS alignment |

---

## Contributor Agreement

All contributors must sign a CLA before their first PR is merged. This ensures KOOMPI can operate Seahorse as a commercial managed service without GPL-style obligations. The MIT license on the code is unaffected — contributors and users retain full rights to self-host.

---

## What Seahorse Is Not

- Not a chatbot
- Not a generic AI assistant
- Not built on OpenClaw, TinyClaw, or any external agent framework
- Not English-only
- Not cloud-only (KOOMPI Mini is local-first)
- Not enterprise-first — SME-first, enterprise later

---

*This document is the source of truth for KOOMPI Seahorse. Update it when decisions change.*
