# AGENTS.md

## Cursor Cloud specific instructions

Bagrry is two packages in one repo:

- **`desktop/`** — Tauri v2 + React 19 notepad. The Rust side (`desktop/src-tauri`) hosts embedded SQLite, audio capture, tray, and global hotkeys. The React frontend talks to it over Tauri IPC. This window is the product — it must not host the marketing site.
- **`web/`** — Next.js App Router marketing site (landing, pricing, integrations, download). Run separately with `npm run dev` from `web/`.

### Running / building / linting

- Package manager is **npm** (or Bun in `desktop/` via `bun.lock`). JS deps for the desktop app: `npm install` / `bun install --cwd desktop`.
- Desktop: `cd desktop && bun run tauri dev` (Vite on `http://localhost:1420`, then native window). First Rust build ~1 min.
- Desktop frontend gate: `cd desktop && npm run build` (`tsc && vite build`).
- Website: `cd web && npm run dev` (Next on `http://localhost:3000`). Gate: `cd web && npm run build`.
- Rust: `cd desktop/src-tauri && cargo check`.

### Non-obvious gotchas

- **GUI needs an X display.** This is a desktop GUI app; there is a real X server on `DISPLAY=:1`. Always `export DISPLAY=:1` before `bun run tauri dev` or the window won't appear.
- **Rust toolchain must be modern.** Transitive deps require edition2024, so use Rust **stable ≥ 1.85** (the VM is pinned to current stable via `rustup default stable`). The old 1.83 toolchain fails to resolve `toml_datetime`.
- `libEGL warning: DRI3 error ...` on launch is harmless — it just falls back to software rendering in the VM.
- **Audio/system-audio is platform-limited.** WASAPI system-audio loopback is Windows-only (`#[cfg(not(windows))]` stubs it out). On this Linux VM `cpal` mic capture may find no input device, so recording/VU features can't be fully exercised here; use SQLite-backed flows (create/list meetings, templates, folders) to verify the IPC stack end-to-end.
- SQLite lives at `{app_data_dir}/bagrry.sqlite` inside the Tauri app data dir; schema + seed data (default folder, templates, recipes) are applied automatically on first launch by `db::open`.
