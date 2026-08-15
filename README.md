# Bagrry

Monorepo:

- **`desktop/`** — Tauri v2 + React notepad (Windows). Opens on notes, not marketing.
- **`web/`** — Next.js marketing site (landing, pricing, integrations, download).

## Desktop

```bash
cd desktop
npm install
npm run tauri dev
```

Add a Groq API key in Settings for transcription and LLM enhancement. Notes, search, people, calendar, and the local API work offline with a heuristic enhancer.

Local REST + MCP: `http://127.0.0.1:47821` (`/v1/notes`, `/v1/folders`, `/v1/notes/search`, `/mcp`).

## Website

```bash
cd web
npm install
npm run dev
```

Opens at `http://localhost:3000`.

## Docs

- **[docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)** — architecture and feature phases.
