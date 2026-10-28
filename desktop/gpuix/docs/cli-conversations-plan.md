# Durable CLI conversations

Issue #63 binds a Hiroshi task to one adapter-owned conversation. Persist the
adapter contract, executable fingerprint/version, model reference, response-only
profile, workspace identity and confirmed vendor ID before follow-ups can run.

Use explicit identifiers only: Cursor `--resume`, Agy `--conversation`, Grok
`--session-id`/`--resume`, and an engine-owned Pi session file. Never use a
latest-session/continue flag. First turns bootstrap from Hiroshi history;
confirmed follow-ups send every newly delivered prompt to the recorded native session.

Reject changed identities, model/profile/workspace transitions, rewinds, missing
sessions and uncertain outcomes. A deliberate fresh-conversation action retains
the transcript, archives the old binding, and permits subsequent queued/new work;
it never replays the interrupted call. Reconnect is observation. Restart may
finish a durably confirmed result without executing the CLI again.

Prove context retention, same-folder isolation, duplicate delivery, version/model
changes, missing sessions, interrupted streams and final-result crash recovery
with real daemons and controlled CLI processes. Keep paid live checks opt-in and
all local launches sequential under explicit resource limits. Deliver protocol,
engine, native recovery controls, source/packaged checks and documentation together.
