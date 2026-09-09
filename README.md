# Fertilizer Dealer CRM — WhatsApp Agent (Phase 1 MVP)

An AI agent that lets fertilizer dealers place orders, check prices, check credit limits,
and get delivery status over WhatsApp — talking to a distributor's own product/price/credit
data, with human escalation for anything the model isn't confident about.

This is a **pilot-scoped MVP**, not a platform. Multi-tenant by `distributor_id` from day
one, but only one distributor is expected to actually use it during the pilot.

## Stack

- **Backend**: NestJS (Node.js) + TypeORM + PostgreSQL
- **WhatsApp**: Meta WhatsApp Cloud API (direct, no BSP)
- **LLM**: Anthropic Claude — `claude-haiku-4-5` for intent classification / routine replies.
  Nothing money- or credit-related is ever decided by the model; those paths escalate to a human.
- **Admin dashboard**: static HTML/JS (no build step) — order feed, escalations, dealer activity, basic login

## Repo layout

```
backend/            NestJS API + WhatsApp webhook + LLM agent + Postgres schema
admin-dashboard/     Minimal static ops/owner dashboard (plain HTML/JS, calls backend API)
docker-compose.yml   Local Postgres for development
```

## Getting started (local dev)

1. **Start Postgres**

   ```bash
   docker compose up -d
   ```

2. **Configure the backend**

   ```bash
   cd backend
   cp .env.example .env
   # fill in DATABASE_URL, ENCRYPTION_KEY, JWT_SECRET, ANTHROPIC_API_KEY,
   # WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN
   npm install
   npm run migration:run
   npm run seed        # creates a demo distributor, dealers, products, an owner login
   npm run start:dev
   ```

3. **Expose the webhook** (Meta requires HTTPS): use `ngrok http 3000` (or similar) and set
   the callback URL in the Meta App dashboard to `https://<ngrok-host>/whatsapp/webhook`,
   with the verify token matching `WHATSAPP_VERIFY_TOKEN`.

4. **Open the admin dashboard**

   Serve `admin-dashboard/` as static files (e.g. `npx serve admin-dashboard`) and point it
   at the backend API (`admin-dashboard/config.js`). Log in with the seeded owner account.

## Security posture (non-negotiable, built in from the start)

- Every query is scoped by `distributor_id` — enforced centrally, not per-query, see
  [`backend/src/common/services/tenant-scoped.repository.ts`](backend/src/common/services/tenant-scoped.repository.ts).
- `credit_limit`, `current_balance`, and `products.price` are encrypted at rest with
  AES-256-GCM (application-level, key from `ENCRYPTION_KEY`) via a TypeORM column
  transformer — see [`backend/src/common/transformers/encrypted-column.transformer.ts`](backend/src/common/transformers/encrypted-column.transformer.ts).
  (Postgres `pgcrypto` is an equally valid choice; application-level encryption was chosen
  so the MVP doesn't depend on the pilot distributor's managed-Postgres extension policy.)
- All secrets (WhatsApp token, Anthropic API key, DB credentials, JWT secret, encryption
  key) come from environment variables — see `.env.example`. Never commit `.env`.
- Conversation logs (`conversations` table) are retained for `CONVERSATION_RETENTION_DAYS`
  (default 90) and purged by a daily scheduled job — see
  [`backend/src/modules/retention`](backend/src/modules/retention). An admin endpoint
  (`DELETE /admin/distributors/:id/data`) supports deleting a distributor's data on request.
- The logger redacts sensitive fields before writing — see
  [`backend/src/common/logging/redacting-logger.service.ts`](backend/src/common/logging/redacting-logger.service.ts).
  Never log `credit_limit`, `current_balance`, `price`, tokens, or raw message bodies at
  `info` level or above.

## Build order / status

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Core infra + WhatsApp Cloud API integration + schema | done in this scaffold |
| 2 | LLM intent parsing wired to real price/credit data | done in this scaffold (needs pilot data + prompt tuning) |
| 3 | Order placement flow + escalation logic | done in this scaffold (needs pilot rules tuning) |
| 4 | Admin dashboard + demo data polish | minimal version done; polish during pilot prep |
| 5 | Pilot with one real distributor | not started |

## Explicitly out of scope for Phase 1

Multi-module platform shell, shared RAG knowledge base, QC/compliance/HSE/export docs,
procurement analysis, predictive maintenance, full RBAC/SSO. Do not build these yet.
