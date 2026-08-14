# Bagrry

Windows desktop meeting notes: bot-free capture from system and mic audio, local SQLite, Groq Whisper/Llama, and a Tauri + React client.

## Docs

- **[docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)** — architecture and feature phases.

## Run

```bash
cd desktop
npm install
# cargo on PATH
npm run tauri dev
```

Add a Groq API key in Settings for transcription and LLM enhancement. Notes, search, people, calendar, and the local API work offline with a heuristic enhancer.

Local REST + MCP: `http://127.0.0.1:47821` (`/v1/notes`, `/v1/folders`, `/v1/notes/search`, `/mcp`).
