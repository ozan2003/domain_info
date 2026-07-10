# Domain Info

A full-stack network diagnostic tool with user authentication. Look up DNS
records (A, AAAA, MX, NS, TXT, CNAME, PTR), run traceroutes, fetch WHOIS
data, and resolve ASN info — all with 1-hour SQLite caching and a paginated
history timeline.

## Features

- **DNS records** — A, AAAA, MX (with priority), NS, TXT, CNAME, and PTR
- **Traceroute** — full network path trace with per-hop IP and RTT, 60s timeout
- **WHOIS** — registrar, creation/expiration dates, name servers, raw output
- **ASN** — IP-to-AS mapping via Team Cymru DNS (IPv4 + IPv6)
- **User auth** — register / login / logout with argon2-hashed passwords and
  JWT in httpOnly cookies (7-day expiry)
- **1-hour cache** — every lookup type is cached in SQLite; cache hits create
  history entries flagged `isCached`
- **History** — flat, paginated timeline across all lookup types, scoped per
  user
- **Statistics** — per-user aggregates: totals per type, cache hit ratios, top
  domains, top registrars, top ASNs, average hop count
- **Rust-like error handling** — `Option` / `Result` / `match` via `oxide.ts`

## Tech Stack

- **Frontend:** React, Vite, TypeScript, oxide.ts
- **Backend:** Hono, Node.js, TypeScript, Zod
- **Database:** SQLite via Prisma
- **Auth:** argon2, Hono JWT, httpOnly cookies
- **Networking:** `nodejs-traceroute`, `whois`, Team Cymru DNS (ASN),
  Node.js `dns` module
- **Testing:** Vitest

## Quick Start

```bash
# 1. Configure the server environment
cp server/.env.example server/.env
# Edit .env: set a JWT_SECRET (>= 32 characters, do not use "change-me")

# 2. Set up the database
cd server
npm install
npx prisma migrate dev --name init
npx prisma generate

# 3. Start the backend (port 6633)
npm run dev

# 4. Start the frontend (port 5173, proxies /api to backend)
cd ../client
npm install
npm run dev
```

## Environment Variables

| Variable       | Purpose                                | Default         |
| -------------- | -------------------------------------- | --------------- |
| `DATABASE_URL` | SQLite database file path              | `file:./dev.db` |
| `JWT_SECRET`   | JWT signing key (min 32 chars)         | _required_      |
| `NODE_ENV`     | Set to `production` for secure cookies | —               |
| `PORT`         | Backend listen port                    | `6633`          |

## API

All `/api/*` routes (except `/api/auth/register` and `/api/auth/login`)
require a valid JWT set as the `token` httpOnly cookie.

### Auth

| Method | Path                 | Body                  | Description             |
| ------ | -------------------- | --------------------- | ----------------------- |
| POST   | `/api/auth/register` | `{ email, password }` | Create user, set cookie |
| POST   | `/api/auth/login`    | `{ email, password }` | Login, set cookie       |
| POST   | `/api/auth/logout`   | —                     | Clear cookie            |
| GET    | `/api/auth/me`       | —                     | Return current user     |

### Lookups

| Method | Path              | Query                 | Description                               |
| ------ | ----------------- | --------------------- | ----------------------------------------- |
| GET    | `/api/lookup`     | `?domain=example.com` | DNS records (A, AAAA, MX, NS, TXT, CNAME) |
| GET    | `/api/ptr`        | `?ip=1.1.1.1`         | Reverse DNS / PTR record                  |
| GET    | `/api/traceroute` | `?domain=example.com` | Network traceroute with hop list          |
| GET    | `/api/whois`      | `?domain=example.com` | WHOIS registration data                   |
| GET    | `/api/asn`        | `?ip=1.1.1.1`         | AS number, name, and prefix               |

All lookup responses share `isCached` (boolean) and `createdAt` (ISO string).

### User Data

| Method | Path           | Query / Body          | Description                        |
| ------ | -------------- | --------------------- | ---------------------------------- |
| GET    | `/api/history` | `?page=1&pageSize=25` | Paginated history across all types |
| GET    | `/api/stats`   | —                     | Per-user aggregate statistics      |

### Health

```bash
GET /health  ->  { "isOk": true }
```

## Testing

```bash
cd server
npm run test          # Run once
npm run test:watch    # Watch mode
```

Uses Vitest with `app.request()` integration tests. The test suite runs
against an isolated SQLite database (`prisma/test.db`) with tables cleaned
between tests.

## Scripts

### Server

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `npm run dev`        | Start dev server with hot reload |
| `npm run build`      | Compile TypeScript to `dist/`    |
| `npm run start`      | Run compiled output              |
| `npm run lint`       | Run ESLint                       |
| `npm run test`       | Run Vitest suite once            |
| `npm run test:watch` | Run Vitest in watch mode         |
| `npm run db:migrate` | Run Prisma migrations            |
| `npm run db:studio`  | Open Prisma Studio (DB browser)  |

### Client

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start Vite dev server               |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview production build            |
| `npm run lint`    | Run ESLint                          |
