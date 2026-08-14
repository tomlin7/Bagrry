# Bagrry — Master Plan

Full-featured meeting-notes desktop app for **Windows** using **Tauri (Rust) + React + Groq (Whisper & Llama) + Local SQLite**.

---

## System Architecture Blueprint

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Tauri Desktop Client (Windows)                  │
│                                                                        │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │      React UI (Tailwind + TipTap)│  │      Rust Core (Native OS)  │  │
│  │  • Split Scratchpad / Enhanced  │  │  • WASAPI Dual Loopback/Mic │  │
│  │  • "Zoom In" Citation Inspector │  │  • Opus Audio Chunking      │  │
│  │  • Global Chat & People Graph   │  │  • Local SQLite + FTS5/Vec  │  │
│  │  • Calendar & Pre-Meeting Brief │  │  • Local MCP / API Server   │  │
│  └────────────────┬────────────────┘  └──────────────┬──────────────┘  │
└───────────────────┼──────────────────────────────────┼─────────────────┘
                    │ Tauri IPC                        │ HTTPS / REST
                    ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          External Cloud Services                       │
│                                                                        │
│  ┌────────────────────────┐  ┌─────────────────┐  ┌──────────────────┐ │
│  │    Groq STT & LLMs     │  │ Google/MS OAuth │  │ Webhook / CRMs   │ │
│  │ • whisper-large-v3-turbo│  │ • Calendar API  │  │ • Notion, Slack  │ │
│  │ • llama-3.3-70b-versat.│  │ • Graph API     │  │ • HubSpot, Attio │ │
│  └────────────────────────┘  └─────────────────┘  └──────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Project Scaffolding & Storage Foundation

### 1. Tauri + React Workspace Setup

* Initialize Tauri v2 (`tauri` + `tauri-build`) with React, TypeScript, Tailwind CSS, and `shadcn/ui`.
* Set up state management via **Zustand** and data fetching with **TanStack Query**.

**Status:** Scaffolding complete in `desktop/`: Tailwind CSS, shadcn/ui primitives, Zustand, TanStack Query, `rusqlite` with FTS5, and a `vectors` blob table. `sqlite-vec` is an optional Cargo feature (`sqlite-vec`) for the `vec0` virtual table.

### 2. Local Database Schema (`rusqlite` + `sqlite-vec`)

Configure local storage with foreign keys and migrations:

* **`meetings`**: ID, title, date, duration, calendar_event_id, scratchpad_raw, enhanced_notes_json, transcript_json.
* **`transcript_segments`**: ID, meeting_id, speaker (`"me"` vs `"attendees"`), start_ms, end_ms, text, sentence_index.
* **`attendees` & `companies`**: ID, name, email, domain, first_seen, last_seen.
* **`folders`**: ID, parent_id, name, is_shared.
* **`templates` & `recipes`**: ID, name, prompt_template, structure_json, icon.
* **`vectors`**: SQLite table using `sqlite-vec` extension for semantic embedding lookups.

---

## Phase 1: Windows Native Audio Capture (WASAPI Engine)

### 1. Dual-Stream Audio Capture in Rust

* Use `cpal` / `windows-rs` to capture:
  * **Input (Mic):** Active microphone stream via WASAPI Capture.
  * **Output (System):** Active audio endpoint loopback via WASAPI Loopback Capture (picks up Zoom/Teams/Meet attendees).
* Combine into a single stereo stream (Channel 0: Mic, Channel 1: Loopback) or dual-mono buffers at 16kHz sample rate.

### 2. Zero Audio Retention & Buffer Encoding

* Stream raw PCM samples into an in-memory ring buffer.
* Compress audio to **Opus/OGG** or 16kHz lightweight Mono WAV using `opus` / `symphonia` crates before upload to respect Groq's 25MB request limit.
* Delete/flush audio buffers from memory immediately after transcription is confirmed.

### 3. System Tray & Hotkey Integration

* Windows System Tray icon (`tauri-plugin-tray`) showing idle/recording states with dynamic tooltip.
* Global hotkeys (`Win+Shift+R` to start/stop, `Win+Shift+P` to pause).
* Real-time audio waveform / VU meter rendered in the React interface via IPC events.

**Status:** Implemented.

---

## Phase 2: Transcription Engine & Diarization Pipeline

### 1. Groq Whisper Integration

* Rust worker to send multipart audio to Groq's `whisper-large-v3-turbo` endpoint.
* Return timestamps at the word and sentence level (`response_format=verbose_json`).
* Handle calls over 60 minutes by auto-chunking into 25-minute segments and stitching sentence offsets.

### 2. Zero-Cost Speaker Diarization

* Map Channel 0 → **"Me"** (Note Owner).
* Map Channel 1 → **"Remote Participants"**.
* Assign consecutive `sentence_id` tags (e.g., `s_001`, `s_002`) to every discrete sentence for downstream citation tracking.

---

## Phase 3: The Core AI Notepad & Human-in-the-Loop Enhancement

### 1. Split Note-Taking Interface

* **Left / Top Pane (My Notes):** Active scratchpad editor for rough keywords, thoughts, and shorthand notes taken live during the call.
* **Right / Bottom Pane (Enhanced View):** The structured document generated post-call.

### 2. Enhancement Prompt Pipeline (`llama-3.3-70b-versatile`)

Construct a prompt that merges user scratchpad notes with the transcript:

* **Rule 1 (Anchor on User Notes):** Expand the user's manual points using the exact quotes, numbers, and decisions spoken in the transcript.
* **Rule 2 (Fallback):** If the scratchpad is left blank, produce a structured executive summary.
* **Rule 3 (Structured Output with Citations):** Force the LLM to output a JSON schema mapping each bullet point to the sentence IDs used:

```json
{
  "section_title": "Pricing Discussion",
  "bullet_points": [
    {
      "text": "Agreed on $14/user/mo for annual billing with quarterly true-ups.",
      "citations": ["s_042", "s_043"]
    }
  ]
}
```

### 3. "Zoom In" Context Inspector

* In the React UI, hovering over any AI-generated bullet displays a magnifying glass icon.
* Clicking it opens a side popover highlighting the exact verbatim sentences from the transcript matching `citations: ["s_042", "s_043"]`.

---

## Phase 4: Rich Note Editor, Templates & Post-Meeting Recipes

### 1. Rich Text Editor Implementation

* Integrate **TipTap / Lexical** with support for Markdown shortcuts, headers, collapsible sections, checklists, callouts, and `@mentions`.
* Autosave scratchpad and enhanced states to SQLite every 500ms.

### 2. Built-in & Custom Meeting Templates

* Pre-built template configurations:
  * **1-on-1s** (Wins, Challenges, Career Growth, Next Steps).
  * **Sales Discovery** (Pain Points, Budget, Decision Criteria, Objections).
  * **User Research** (User Persona, Feature Feedback, Friction Points, Quotes).
  * **Sprint Planning & Retros** (4Ps: Purpose, Product, People, Process).
* Custom template creator allowing users to define custom sections and enhancement prompt instructions.

### 3. Post-Meeting 1-Click "Recipes"

* Secondary action drawer executing targeted transformation prompts over enhanced notes:
  * *Draft Follow-up Email* (generates client-ready recap with action items).
  * *Extract Action Items & Owners* (structured table of owner, task, and deadline).
  * *Generate Jira/Linear Tickets* (creates copy-pasteable Markdown user stories).
  * *Extract Objections & Blockers*.

### 4. Inline Conversational Note Re-Prompting

* Highlight any block of text in the editor → Floating prompt bar:
  * Quick chips: *"Make more concise"*, *"Add more quotes"*, *"Rephrase for executives"*.
  * Custom prompt input to re-synthesize only the highlighted selection.

### 5. Document & Image Context Attachments

* Drag-and-drop support for slide screenshots (PNG/JPEG) and meeting PDFs.
* Extract text via PDF parsing (`pdf-extract`) or Vision API, appending content to the synthesis prompt.

---

## Phase 5: Calendar Integrations & Pre-Meeting Briefs

### 1. Calendar Sync (Google Calendar + Microsoft Outlook)

* Implement OAuth2 PKCE flow for Google Calendar API and Microsoft Graph API.
* Polling background worker in Rust to check for upcoming events within the next 15 minutes.
* Auto-fill note title, start time, and attendee list (names + emails) when starting a recording.

### 2. Pre-Meeting Briefs

* Before a scheduled call starts, trigger a background LLM query:
  * Search SQLite for previous meetings with the same attendees or company domain.
  * Render a "Pre-Meeting Prep" card showing: past decisions made, unresolved action items, and personal notes on attendees.

---

## Phase 6: In-Meeting Live Copilot ("Ask Bagrry Live")

### 1. Real-Time Streaming Audio Pipeline

* In addition to batch recording, slice audio into 20–30-second rotating PCM chunks.
* Asynchronously transcribe chunks via Groq to maintain a rolling live transcript in memory.

### 2. In-Call Live Chat Drawer

* Side drawer accessible while recording:
  * *"What was the budget figure they just mentioned?"*
  * *"Suggest 3 follow-up questions based on the last 5 minutes."*
* Queries the live transcript buffer using `llama-3.3-70b-versatile` with low latency (<500ms).

---

## Phase 7: Cross-Meeting Intelligence, Semantic Search & People/Company Graph

### 1. Local Semantic Search & Cross-Meeting Chat ("Ask Bagrry")

* Generate embeddings locally using `fastembed-rs` (`all-MiniLM-L6-v2`) on note completion.
* Store vectors in `sqlite-vec` alongside full-text search indexes (`FTS5`).
* **Cross-Meeting Chat:** Query across entire meeting histories (e.g., *"What pricing objections did we encounter across all client calls last month?"*) with citations pointing to specific meetings and notes.

### 2. Folder-Level & Scoped Queries

* Allow filtering semantic search and chat queries by folder ID (e.g., querying only within the *"User Research"* folder).

### 3. People & Companies Knowledge Graph

* Extract unique attendee emails and company domains from calendar metadata.
* **People View:** Dedicated directory page showing all meetings, action items, and shared notes involving a specific person.
* **Companies View:** Groups individual contacts under their organization domain with consolidated account intelligence.

---

## Phase 8: Sharing, Export & SaaS/CRM Integrations

### 1. No-Account Public Web Share Links

* Deploy a lightweight Cloudflare Worker + D1/R2 service.
* 1-Click "Share Note": Uploads a sanitized JSON snapshot of the note, transcript citations, and metadata.
* Provides a public URL where recipients can view the note, click citations to inspect the transcript, and ask follow-up questions without an account.

### 2. SaaS & CRM Sync Integrations

* **Notion:** Push structured notes directly to a designated Notion Database via the Notion REST API.
* **Slack:** 1-Click send note summary / action items to a selected Slack channel.
* **HubSpot & Salesforce:** Push call notes, summaries, and action items directly to corresponding CRM Contact and Deal records.
* **Attio & Linear:** Export meeting takeaways and auto-create Linear issue cards.
* **Webhooks & Zapier:** Outgoing webhook dispatches on meeting completion.

---

## Phase 9: Developer Ecosystem (Public API & MCP Server)

### 1. Model Context Protocol (MCP) Server

* Bundle a local MCP server (HTTP / stdio transport) inside the Tauri client.
* Expose MCP tools to Claude Desktop, ChatGPT, and Claude Code:
  * `query_bagrry_meetings` (chat across meeting knowledge)
  * `list_meetings` & `list_meeting_folders`
  * `get_meetings` (retrieve structured notes, private scratchpad, and enhanced summaries)
  * `get_meeting_transcript` (fetch full raw transcript with citations)

### 2. Local & Cloud REST API

* Local REST API daemon on `localhost:PORT` with personal API key authentication.
* REST endpoints:
  * `GET /v1/notes` & `GET /v1/notes/{id}`
  * `GET /v1/folders`
  * `POST /v1/notes/search`

---

## Phase 10: Transparency, Consent Tools & Hardening

### 1. Meeting Consent & Transparency Tools

* **Auto-Chat Consent Message:** Optional setting to auto-copy or prompt a standard disclaimer (e.g., *"Note: Taking notes using Bagrry"*) for Google Meet / Teams chat.
* **Visual Recording Watermark:** Optional floating desktop widget/overlay indicating that audio is actively being transcribed.

### 2. Security, BYOK & Packaging

* **Credential Security:** Store Groq API keys, Google/MS OAuth tokens in Windows Credential Manager using `keyring-rs`.
* **BYOK & Managed Tiers:** Support user-provided Groq keys for zero-cost operation, or hosted proxy routing.
* **Packaging:** Tauri NSIS `.exe` / `.msi` Windows installer with auto-updater (`tauri-plugin-updater`).

---

## Feature vs. Phase Matrix

| # | Feature | Implementation Phase | Key Tech / Library |
| --- | --- | --- | --- |
| **1** | Bot-Free System + Mic Audio Capture | **Phase 1** | Windows WASAPI Loopback (`cpal`/`windows-rs`) |
| **2** | System Tray & Global Hotkeys | **Phase 1** | `tauri-plugin-tray` + `tauri-plugin-global-shortcut` |
| **3** | Zero Audio Retention Policy | **Phase 1** | In-memory RAM buffer flushing |
| **4** | Fast Whisper Transcription | **Phase 2** | Groq `whisper-large-v3-turbo` API |
| **5** | Speaker Diarization (Me vs. Others) | **Phase 2** | Dual-channel WASAPI stream splitting |
| **6** | Human Scratchpad + AI Synthesis | **Phase 3** | Groq `llama-3.3-70b-versatile` |
| **7** | "Zoom In" Context Inspector / Citations | **Phase 3** | JSON sentence indexing (`s_xxx`) + Popover UI |
| **8** | Rich Text Editor with Markdown & Mentions | **Phase 4** | TipTap / Lexical Editor React extensions |
| **9** | Meeting Templates (1:1, Sales, Sprint, 4Ps) | **Phase 4** | Templated system prompts & JSON structures |
| **10** | 1-Click Post-Call Recipes (Emails, Jira) | **Phase 4** | Secondary Groq extraction prompts |
| **11** | Conversational / Highlight Re-Prompting | **Phase 4** | Selection-context LLM prompt pipeline |
| **12** | PDF & Image Context Attachments | **Phase 4** | `pdf-extract` + Vision OCR pipeline |
| **13** | Google & Outlook Calendar Sync | **Phase 5** | Google Calendar API + MS Graph OAuth2 |
| **14** | Pre-Meeting Briefs & Prep Cards | **Phase 5** | Historical attendee query + LLM synthesis |
| **15** | In-Meeting Live Copilot ("Ask Live") | **Phase 6** | 20s rotating chunk transcription + LLM drawer |
| **16** | Cross-Meeting Global Chat ("Ask Bagrry") | **Phase 7** | `sqlite-vec` + `fastembed-rs` (Local embeddings) |
| **17** | Folder Scoping & Folder Queries | **Phase 7** | Hierarchical folder indexing in SQLite |
| **18** | People & Companies Knowledge Views | **Phase 7** | Relational entity aggregation tables |
| **19** | Public Web Share Links (Interactive citations) | **Phase 8** | Cloudflare Workers + Static Web Viewer |
| **20** | CRM & SaaS Sync (Notion, Slack, HubSpot) | **Phase 8** | Direct OAuth REST API integrations |
| **21** | Model Context Protocol (MCP) Server | **Phase 9** | Bundled Local MCP HTTP/stdio daemon |
| **22** | Public Developer REST API | **Phase 9** | Local Axum server / Cloudflare Gateway |
| **23** | Transparency & Chat Consent Tools | **Phase 10** | Clipboard injection + desktop overlay |
| **24** | Windows Installer & Keychain Security | **Phase 10** | Windows Credential Manager (`keyring-rs`) + NSIS |
