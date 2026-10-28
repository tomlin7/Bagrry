# Usage, daemon access, and project selection

## Delivery plan

1. Project selection: a searchable anchored menu in the greeting and footer,
   the current project marked, an existing-folder action, and a real no-project
   task backed by an isolated, engine-owned scratch directory. Preserve the
   existing task, draft, workspace identity, and missing-folder behavior.
2. Daemon access: retain the private loopback listener and add a separately
   authenticated, opt-in network listener. Validate port and exact browser
   origins; apply changes atomically, expose failures, and support token reveal,
   copy, and rotation. Network clients cannot change listener configuration or
   retrieve credentials. Show the actual HTTP/SSE endpoint used by Hiroshi.
3. Usage: aggregate durable activity across tasks, including retries, with UTC
   date filters, daily/monthly/project views, token/cost charts, breakdowns,
   cache details, and coverage. Provider-reported costs and configured rate
   estimates are distinct; unknown costs remain unknown. Read available local
   agent usage histories without changing them or importing conversation text.
   Hiroshi is authoritative; exclude matching vendor sessions from imports.

## Verification gates

- Real daemon tests for scratch isolation, network opt-in/persistence, exact
  CORS, authentication, local-only administration, token rotation, port conflicts,
  analytics deduplication, cumulative counters, pricing, and unavailable history.
- Native controls and source/packaged windows cover complete user operations.
- Use temporary profiles. Never enable network exposure on the user's profile
  as part of development. Run builds and tests sequentially under the existing
  RAM, process-count, free-memory, and timeout guards.
- Compare native screenshots with the supplied layouts. Ship functional empty,
  unavailable, busy, failure, and disconnected states alongside populated views.

## Usage accounting and history

Hiroshi's database is the primary activity record. Usage combines the latest
reported counters within each attempt and counts retries separately. Input
includes cache reads and writes; output includes reasoning. Missing counters and
costs are unknown, not free usage. Reports cover up to 366 UTC days and attribute
each attempt to its start time. Breakdowns show up to 100 groups while totals
retain all observed activity.

Available Codex, Claude Code, Pi and Oh My Pi JSONL histories are scanned read-only
when Usage opens or Refresh is pressed. Imported records contain usage metadata,
not conversation text. Duplicate snapshots/forks and vendor sessions already
recorded by Hiroshi are excluded. The importer is bounded to 10 seconds, 512 files,
256 MiB and 100,000 records; partial scans are marked. Missing histories and formats
without supported usage metadata, including current Cursor Agent/Agy stores, are
shown explicitly. Grok histories without token metadata remain unsupported.

No current market prices are assumed. Provider-reported USD cost takes precedence;
source estimates or manual USD-per-million model rates supply estimates otherwise.
Select a model row to save/remove rates. Cache savings require an explicit rate.
Unreported cache categories use the input rate when estimating and remain
unclassified in the token breakdown. Subscription bills may differ from estimates.

## Daemon connections and scratch tasks

The private loopback connection always remains available. Network exposure defaults
off. Enabling it binds all IPv4 interfaces at the chosen port using a separate bearer
token. Browser requests must match an allowed HTTP/HTTPS origin exactly. The
displayed endpoint uses the current HTTP/SSE protocol. A trusted HTTPS proxy is
needed outside a private network. Applying settings or rotating the credential
closes network connections without restarting the engine or interrupting tasks.
Credential reveal, rotation and listener administration are local-only operations.

Configuration lives in `network.json`; model rates live in `usage-pricing.json`,
both inside the engine profile. Invalid files are preserved and surfaced as errors.
Scratch tasks keep files under `workspaces/scratch/<id>` inside that profile. Each
new scratch task has its own directory, transcript and draft and is excluded from
recent projects. These directories are durable; there is no automatic deletion.
