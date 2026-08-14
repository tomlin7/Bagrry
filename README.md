# Bagrry

Windows desktop meeting notes: bot-free capture from system and mic audio, local SQLite, Groq Whisper/Llama, and a Tauri + React client.

## Docs

The phase-wise product and architecture plan lives here:

- **[docs/MASTER_PLAN.md](docs/MASTER_PLAN.md)** — architecture, Phases 0–10, and feature matrix.

## Repo layout

| Path | What it is |
| --- | --- |
| `desktop/` | Tauri v2 + React 19 + TypeScript + Vite app (`com.bit.bagrry`) |
| `docs/` | Product and architecture documents |

Phase 0 scaffolding is in place. Phase 1 capture (mic + WASAPI loopback, tray, Win+Shift+R/P, in-memory WAV) is in the desktop app.

## Desktop app (current scaffold)

```bash
cd desktop
bun install
bun run tauri dev
```
