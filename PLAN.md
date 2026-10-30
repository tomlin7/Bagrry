Note: I plan to land this as 6 sequential PRs off main, each independently green (typecheck + clippy + tests), rather than one unreviewable branch. Details below.

Bagrry desktop: premium UI rebuild + production hardening
Assumptions (flagging these because they change scope)
No cloud backend. The reference app shows workspaces, members, invites, billing, trial banners and sign-out. Bagrry is local-first with no server, so I will not fake auth or a paywall. Spaces stay local, Members shows only you, and I will delete the fake plan picker still sitting in desktop/src/components/pages.tsx [blocked] (Basic — $0 / Business — $14 / Enterprise — $35). Real multi-user sync is a separate project; say the word and I will scope it.
Fonts self-hosted. The reference uses licensed faces (Quadrant/Melange). I will keep Fraunces + Instrument Sans but bundle them as woff2 instead of the current Google Fonts <link> in desktop/index.html [blocked], which breaks a desktop app offline.
Model picker lists real Groq models. The screenshots show Anthropic names; same visual treatment, real backing.
Theme: dark is the default, with Light and System in Settings > Appearance, matching the reference Theme row.
Why the current app needs a rebuild, not a patch
Frontend: only one UI primitive exists (desktop/src/components/ui/button.tsx [blocked]) and the only Radix package installed is react-slot. There is no router — navigation is a Zustand string union in desktop/src/store/app.ts [blocked]. Dark tokens exist in desktop/src/index.css [blocked] but .dark is never applied to any element, so dark mode is dead code. NoteEditor persists editor.getText(), so every bold/heading/list a user types is destroyed on reload. Errors surface as String(e) in a red banner that doubles as the success channel. 716 KB single JS chunk, no code splitting, no tests, no ESLint.

Backend: two provable crashes/hangs and a hard capacity ceiling.

Deadlock: pause locks state then session; stop locks session (held across thread joins) then state — desktop/src-tauri/src/audio/mod.rs [blocked] lines 143-147 vs 170-193.
Lock across network: pre_meeting_brief holds Mutex<Connection> for the whole Groq round-trip (desktop/src-tauri/src/commands.rs [blocked] ~710-734), freezing every other DB op.
STT ceiling: transcribe_wav uploads the entire file with no chunking or size check; past roughly 14 minutes per mono channel it exceeds Groq's ~25 MB limit and simply fails. Meanwhile the 90-minute in-RAM cap is ~165 MB per channel, and push_capped silently discards the oldest audio.
No live transcription at all. live_ask takes a string the user types into a textarea by hand.
Local API is unsafe and serial: for req in server.incoming_requests() handles one request at a time, auth is headers().any(|h| h.value.contains(&expected)) (substring, any header), /mcp and /share/* skip auth entirely, an empty key means fully open, and 9 .unwrap() calls on SQL will panic the thread and kill the API permanently.
Demo "Northwind" data is inserted into every real user's database (desktop/src-tauri/src/db/migrations.rs [blocked] 259-260). FTS5 is built but never queried (all search is LIKE '%q%'). Zero indexes. persist_transcript is non-transactional. Secrets fall back to plaintext in SQLite. All 50 commands are sync. No tests, no CI, no release profile, no updater, "csp": null, and both bun.lock and package-lock.json are committed.
PR 1 — Design system, window chrome, routing
Rewrite desktop/src/index.css [blocked] as a dark-first semantic token set derived from the screenshots: surface ladder (bg, surface, elevated, overlay), text (primary/secondary/tertiary), hairline borders at ~8% white, olive accent for focus rings and links, green for primary actions, amber for the date marker. Light mode mirrors it with the parchment palette. Delete unused .grain/.orb/.marquee-track and every hardcoded hex in components (bg-[#f7f7f2], #fbfaf5, #1c1914, #e4dfd3).
ThemeProvider writing .dark on <html>, persisted in the SQLite settings table with a localStorage cache to avoid first-paint flash. Options: Dark / Light / System.
Install the Radix set actually needed: dialog, popover, dropdown-menu, tooltip, select, switch, tabs, scroll-area, separator, collapsible, avatar, visually-hidden. Add cmdk (palette), sonner (toasts, replacing the red busy banner), @tanstack/react-virtual (lists). Build ui/ primitives on top: Button, IconButton, Input, Textarea, Select, Switch, Chip, Card, Dialog, Popover, DropdownMenu, Tooltip, Tabs, ScrollArea, Skeleton, EmptyState, Kbd.
Custom titlebar: set decorations: false, minWidth: 900, minHeight: 600, center: true in desktop/src-tauri/tauri.conf.json [blocked], add a data-tauri-drag-region strip with our own minimize/maximize/close, and add core:window:allow-minimize / allow-maximize / allow-close / allow-start-dragging to desktop/src-tauri/capabilities/default.json [blocked].
Add react-router with a hash router so back/forward and deep links work; routes for /, /chat, /chat/:id, /notes/:id, /space/:id, /shared, /settings/:section. Lazy-load each route and split TipTap into its own chunk.
Add ESLint + Prettier + Vitest to desktop/package.json [blocked], delete the duplicate lockfile, add rust-toolchain.toml.
PR 2 — Screen-by-screen parity
Sidebar: search row with Ctrl+K badge, Home / Shared with me / Chat (collapsible, with recent chats and relative timestamps), a Spaces section with lock and avatar badges plus per-space Add folder, quick-filter icon row, and the bottom workspace switcher. Clicking it opens the popover from screenshot 1: header with member count, Invite teammates, account email, workspace list with checkmark, Add workspace, then Manage templates / Get mobile / Help / Settings with Ctrl+,. Sidebar collapses to the icon-rail state shown in screenshot 4.
Home: Coming up card with the split date block (day number, month with amber dot, weekday), event rows, dashed empty state with Calendar settings, then Today-grouped notes and the ghosted "Your meeting notes will appear here" placeholder. Docked chat bar pinned bottom-center. + New note top-right.
Command palette: cmdk, with the literal Search "<query>" row, a Go to section, note results, and an Ask across meetings action — plus real focus trap and ESC badge.
Chat: greeting page with composer (attach, model picker, mic), Recents, and recipe chips; the floating expanded panel with history/expand controls, right-aligned user bubbles, per-message copy and feedback actions, scroll-to-bottom pill, and the AI disclaimer footer.
Note editor: distraction-free centered column, serif title, meta chips (date / attendees / folder), the consent link, the bottom recording dock, and the floating transcript panel with search, copy, minimize, audio-source EQ, stop, and language selector.
Space pages: hero with icon badge, description, meta row, dismissible tinted banner (blue for private, olive for team), composer, recipe chips with All recipes, divider, and the first-note empty state.
Settings: full-window layout with its own nav (Preferences, Profile, Calendar, Notifications, Connectors, Get help; Workspace group; red Sign out) and grouped setting cards using icon-tile rows with switch / value+chevron / select controls — the Theme row lands here.
Virtualize the note, transcript, and action lists. Every overlay gets role="dialog", focus trap and restore; every list gets keyboard navigation; wire the Ctrl+Shift+R / Ctrl+Shift+P shortcuts the header already advertises but never registered.
PR 3 — Backend core: errors, logging, DB, async
Replace Result<T, String> with a thiserror AppError enum serialized as { code, message, detail }, so the UI can show real messages and retry affordances instead of raw Rust strings.
Add tracing + tauri-plugin-log with a rolling file in the app log dir, and a "Copy diagnostics" action in Settings.
Swap the single Mutex<Connection> for an r2d2_sqlite pool. Audit every command so no connection is held across I/O (fixes pre_meeting_brief). Wrap multi-statement writes, including persist_transcript, in transactions.
Migration v3: drop the demo SAMPLE insert from the production path, delete the orphan rows it already created, add indexes on transcript_segments.meeting_id, meetings.folder_id, meetings.date, action_items.meeting_id, and rebuild FTS5 to cover title + body text + enhanced notes + transcript. Rewrite search_meetings, ask_bagrry and the HTTP search to use FTS with ranking instead of LIKE. Fix duration_ms, which is never written.
Convert long-running commands to async fn over spawn_blocking, backed by a small persisted job queue that emits job:progress events so transcribe/enhance show real progress and survive a restart.
PR 4 — Audio and transcription
mermaid
flowchart LR
  mic[Mic via cpal] --> ring[Ring buffer]
  sys[WASAPI loopback] --> ring
  ring --> spill[Spill to temp WAV on disk]
  ring --> live[25s rolling window]
  live --> groqLive[Groq Whisper]
  groqLive --> partial["transcript:partial event"]
  spill --> chunker["Chunker: silence split, under 20MB"]
  chunker --> groqBatch[Groq Whisper with retry]
  groqBatch --> stitch["Stitch with time offsets"]
  stitch --> db[(SQLite transcript_segments)]
  stitch --> cleanup[Delete temp audio]
Collapse the five recorder mutexes into one guarded state machine (or an actor thread with an AtomicU8 for status), eliminating the pause/stop deadlock.
Spill PCM to a temp WAV in the app cache dir instead of growing RAM to 165 MB per channel; delete it immediately after transcription so the "no audio retained" promise is real. Replace the silent push_capped drop with a user-visible warning.
Chunk STT at silence boundaries under the API size limit, transcribe with timeout + exponential backoff, and stitch sentence offsets so long meetings stop failing outright.
Implement the real rolling live transcript (25s windows, ~2s overlap) emitting transcript:partial, so the transcript panel and Ask-live actually work instead of asking the user to paste notes.
Surface capture failures as events: unsupported mic format currently kills the thread silently while the UI still says "recording", and any WASAPI error drops the system channel mid-meeting.
PR 5 — Rich text and AI quality
Persist ProseMirror JSON plus a plaintext mirror for search and prompting, with a migration that lifts existing plain text into JSON. This is the fix for the editor.getText() data loss.
Add markdown input rules, a slash command menu, and a selection bubble menu, so "Rewrite selection" operates on the actual selection rather than passing the whole scratchpad.
Validate LLM output with a real schema: reject citations that do not resolve to a sentence_id, and stop silently swallowing malformed JSON into the heuristic fallback. Make enhanced notes editable, keeping the human-ink vs AI-gray distinction.
Provider layer behind the model picker with retries, timeouts and clear quota errors.
PR 6 — Hardening and release
Replace tiny_http with axum on tokio: concurrent requests, constant-time Bearer comparison, a token auto-generated on first run and required by default, /mcp behind auth, 32-byte share tokens with optional expiry, proper CORS with OPTIONS, and no .unwrap() on the request path.
Make /mcp a real JSON-RPC 2.0 endpoint with initialize, tools/list, tools/call and error objects.
Secrets: keyring only. If the keyring is unavailable, warn and refuse rather than writing the Groq key as plaintext into SQLite, and migrate any existing secret:* rows out.
Set a real CSP, tighten capabilities from :default bundles to scoped permissions, add [profile.release] with lto, strip, codegen-units = 1.
NSIS bundle config with publisher, copyright, descriptions, WebView2 bootstrapper, the unused Square*/StoreLogo icons wired up, plus tauri-plugin-updater and createUpdaterArtifacts with the endpoint and pubkey documented. Fix productName casing and sync versions.
Tests: Rust unit tests for migrations, sentence splitting/stitching, citation validation, audio chunking and resampling, and HTTP auth; Vitest + RTL for the store, theme, editor persistence and command palette. GitHub Actions running tsc, ESLint, Vitest, cargo fmt, clippy -D warnings, cargo test, and a tauri build on windows-latest with artifact upload.
