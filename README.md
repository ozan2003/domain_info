# Domain Info

A full-stack DNS record lookup tool, just enter a domain name and inspect
A, MX, NS, TXT, and CNAME records in a clean dark-themed UI.

## Features

- Resolve A, MX (with priority), NS, TXT, and CNAME records
- Collapsible accordion UI with record counts
- One-click copy to clipboard for any record type
- Loading spinner and descriptive error states
- Full TypeScript, strict linting, Zod validation

## Tech Stack

- **Frontend:** React, Vite, TypeScript
- **Backend:** Hono, Node.js, TypeScript
- **Validation:** Zod

## Quick Start

```bash
# 1. Start the backend (port 6633)
cd server
npm install
npm run dev

# 2. Start the frontend (port 5173, proxies /api to backend)
cd client
npm install
npm run dev
```

Open `http://localhost:5173`, type a domain, and click Lookup.

## API

```bash
GET /api/lookup?domain=example.com
```

Response:

```json
{
  "domain": "example.com",
  "a": ["93.184.216.34"],
  "mx": [{ "exchange": "mail.example.com", "priority": 10 }],
  "ns": ["ns1.example.com"],
  "txt": [["v=spf1 ..."]],
  "cname": [],
  "error": null
}
```

`GET /health` returns `{ "isOk": true }`.

## Scripts

### Server

| Command         | Description                      |
|-----------------|----------------------------------|
| `npm run dev`   | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/`    |
| `npm run start` | Run compiled output              |
| `npm run lint`  | Run ESLint                       |

### Client

| Command           | Description                         |
|-------------------|-------------------------------------|
| `npm run dev`     | Start Vite dev server               |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview production build            |
| `npm run lint`    | Run ESLint                          |
