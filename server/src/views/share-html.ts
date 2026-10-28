export interface ShareViewData {
  title: string
  date: string
  durationMinutes: number
  workspaceName: string
  attendees: string[]
  enhancedDoc: {
    sections: Array<{
      section_title: string
      bullet_points: Array<{
        text: string
        citations: string[]
      }>
    }>
  } | null
  scratchpad: string
  transcriptSegments: Array<{
    id: string
    speaker: string
    start_ms: number
    text: string
    sentence_id: string
  }>
  shareToken: string
}

export function renderShareHtml(data: ShareViewData): string {
  const enhancedSections = data.enhancedDoc?.sections || []

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)} · Bagrry</title>
  <style>
    :root {
      --bg: #252523;
      --surface: #2b2b29;
      --surface2: #333330;
      --border: #3a3a37;
      --border-strong: #474743;
      --text: #e5e5e0;
      --text-muted: #a1a19a;
      --text-subtle: #72726d;
      --accent: #c3dd4f;
      --accent-fg: #1e2604;
      --accent-subtle: #c3dd4f1a;
      --danger: #f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    header {
      width: 100%;
      border-bottom: 1px solid var(--border);
      background-color: var(--surface);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 14px;
      color: var(--text);
      letter-spacing: -0.02em;
    }
    .brand-badge {
      background: var(--accent);
      color: var(--accent-fg);
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: grid;
      place-items: center;
      font-size: 12px;
    }
    .meta-tag {
      font-size: 11px;
      color: var(--text-muted);
      background: var(--surface2);
      border: 1px solid var(--border);
      padding: 3px 8px;
      border-radius: 9999px;
    }
    .container {
      width: 100%;
      max-width: 980px;
      padding: 32px 20px 80px 20px;
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 28px;
    }
    @media (max-width: 820px) {
      .container { grid-template-columns: 1fr; }
    }
    .main-col { display: flex; flex-direction: column; gap: 24px; }
    .side-col { display: flex; flex-direction: column; gap: 16px; }
    h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.25;
      color: var(--text);
      margin-bottom: 8px;
    }
    .meta-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .card {
      background-color: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      overflow: hidden;
    }
    .card-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent);
      margin-bottom: 12px;
    }
    .bullet-point {
      margin-bottom: 12px;
      font-size: 14px;
      color: var(--text);
      line-height: 1.6;
    }
    .citation-tag {
      display: inline-block;
      font-size: 10.5px;
      font-family: monospace;
      color: var(--accent);
      background: var(--accent-subtle);
      border: 1px solid var(--accent);
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 6px;
      cursor: pointer;
      text-decoration: none;
      vertical-align: middle;
      transition: background 0.15s ease;
    }
    .citation-tag:hover {
      background: var(--accent);
      color: var(--accent-fg);
    }
    .transcript-box {
      max-height: 520px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-right: 4px;
    }
    .seg-row {
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--surface2);
      border-left: 3px solid var(--border-strong);
      font-size: 12.5px;
      transition: all 0.2s ease;
    }
    .seg-row.highlighted {
      border-left-color: var(--accent);
      background: #3b3b28;
    }
    .seg-speaker {
      font-weight: 600;
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
    }
    .qa-box {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .qa-input {
      width: 100%;
      height: 38px;
      border-radius: 8px;
      border: 1px solid var(--border-strong);
      background: var(--surface2);
      color: var(--text);
      padding: 0 12px;
      font-size: 13px;
      outline: none;
    }
    .qa-input:focus { border-color: var(--accent); }
    .qa-btn {
      align-self: flex-end;
      height: 32px;
      padding: 0 14px;
      border-radius: 6px;
      background: var(--accent);
      color: var(--accent-fg);
      font-size: 12.5px;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }
    .qa-answer {
      font-size: 13px;
      color: var(--text);
      background: var(--surface2);
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      display: none;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-badge">B</div>
      <span>Bagrry</span>
      <span style="color: var(--text-subtle); font-weight: 400; font-size: 12px;">· Meeting Note</span>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <span class="meta-tag">${escapeHtml(data.workspaceName)}</span>
      <span class="meta-tag">Public Shared Link</span>
    </div>
  </header>

  <div class="container">
    <div class="main-col">
      <div>
        <h1>${escapeHtml(data.title)}</h1>
        <div class="meta-bar">
          <span class="meta-tag">📅 ${escapeHtml(data.date.slice(0, 10))}</span>
          <span class="meta-tag">⏱️ ${Math.max(1, Math.round(data.durationMinutes))} min call</span>
          ${data.attendees.map((att) => `<span class="meta-tag">👤 ${escapeHtml(att)}</span>`).join('')}
        </div>
      </div>

      ${enhancedSections.length > 0 ? enhancedSections.map((sec) => `
        <div class="card">
          <div class="card-title">${escapeHtml(sec.section_title)}</div>
          <div>
            ${sec.bullet_points.map((bp) => `
              <div class="bullet-point">
                <span>• ${escapeHtml(bp.text)}</span>
                ${bp.citations.map((c) => `
                  <a class="citation-tag" onclick="highlightCitation('${escapeHtml(c)}')">cite ${escapeHtml(c)}</a>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('') : `
        <div class="card">
          <div class="card-title">Scratchpad Notes</div>
          <p style="white-space: pre-wrap; font-size: 13.5px; color: var(--text);">${escapeHtml(data.scratchpad)}</p>
        </div>
      `}

      <!-- Interactive Q&A on this Note -->
      <div class="card">
        <div class="card-title">Ask Questions About This Call</div>
        <div class="qa-box">
          <input id="qaInput" class="qa-input" placeholder="e.g. What were the key deadlines or decisions?" onkeydown="if(event.key==='Enter')askQuestion()"/>
          <button class="qa-btn" onclick="askQuestion()">Ask</button>
          <div id="qaAnswer" class="qa-answer"></div>
        </div>
      </div>
    </div>

    <!-- Side Column: Transcript with Citation Jumps -->
    <div class="side-col">
      <div class="card" style="position: sticky; top: 68px;">
        <div class="card-title" style="color: var(--text-muted); font-size: 12px; margin-bottom: 8px;">
          Verified Transcript Citations (${data.transcriptSegments.length})
        </div>
        <div id="transcriptBox" class="transcript-box">
          ${data.transcriptSegments.map((s) => `
            <div id="seg-${escapeHtml(s.sentence_id)}" class="seg-row" data-cite="${escapeHtml(s.sentence_id)}">
              <div class="seg-speaker">
                <span>${s.speaker === 'me' ? 'Host (Me)' : 'Attendees'}</span>
                <span style="font-family: monospace;">${escapeHtml(s.sentence_id)}</span>
              </div>
              <div>${escapeHtml(s.text)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  </div>

  <script>
    function highlightCitation(citeId) {
      document.querySelectorAll('.seg-row').forEach(el => el.classList.remove('highlighted'));
      const target = document.getElementById('seg-' + citeId);
      if (target) {
        target.classList.add('highlighted');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    async function askQuestion() {
      const input = document.getElementById('qaInput');
      const ans = document.getElementById('qaAnswer');
      const q = input.value.trim();
      if (!q) return;

      ans.style.display = 'block';
      ans.innerText = 'Analyzing meeting transcript…';

      try {
        const res = await fetch('/v1/shares/${encodeURIComponent(data.shareToken)}/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q })
        });
        const json = await res.json();
        ans.innerText = json.answer || json.error || 'No answer generated.';
      } catch (err) {
        ans.innerText = 'Error querying meeting details: ' + err.message;
      }
    }
  </script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
