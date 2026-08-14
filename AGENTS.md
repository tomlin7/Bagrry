# AGENTS.md

## Cursor Cloud specific instructions

Bagrry is a single product: a **Tauri v2 + React 19 desktop app** living in `desktop/`. There is no separate backend server — the Rust side (`desktop/src-tauri`) hosts an embedded SQLite DB, audio capture, tray, and global hotkeys, and the React frontend talks to it over Tauri IPC. Standard scripts live in `desktop/package.json`; run everything from `desktop/`.

### Running / building / linting

- Package manager is **Bun** (`bun.lock`). JS deps are refreshed by the startup update script (`bun install --cwd desktop`).
- Run the full app in dev: `bun run tauri dev` (starts Vite on `http://localhost:1420`, then compiles and launches the native window). The first Rust build takes ~1 min; subsequent runs are incremental.
- Frontend typecheck + build (doubles as the lint/typecheck gate): `bun run build` (runs `tsc && vite build`).
- Rust check/build: `cd src-tauri && cargo check` (or `cargo build`). There is no separate JS linter (no ESLint config).

### Non-obvious gotchas

- **GUI needs an X display.** This is a desktop GUI app; there is a real X server on `DISPLAY=:1`. Always `export DISPLAY=:1` before `bun run tauri dev` or the window won't appear.
- **Rust toolchain must be modern.** Transitive deps require edition2024, so use Rust **stable ≥ 1.85** (the VM is pinned to current stable via `rustup default stable`). The old 1.83 toolchain fails to resolve `toml_datetime`.
- `libEGL warning: DRI3 error ...` on launch is harmless — it just falls back to software rendering in the VM.
- **Audio/system-audio is platform-limited.** WASAPI system-audio loopback is Windows-only (`#[cfg(not(windows))]` stubs it out). On this Linux VM `cpal` mic capture may find no input device, so recording/VU features can't be fully exercised here; use SQLite-backed flows (create/list meetings, templates, folders) to verify the IPC stack end-to-end.
- SQLite lives at `{app_data_dir}/bagrry.sqlite` inside the Tauri app data dir; schema + seed data (default folder, templates, recipes) are applied automatically on first launch by `db::open`.
