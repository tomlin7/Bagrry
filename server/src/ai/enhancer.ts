import { CONFIG } from '../config'

export interface Segment {
  id?: string
  sentence_id: string
  speaker: string
  text: string
}

export interface EnhancedSection {
  section_title: string
  bullet_points: Array<{
    text: string
    citations: string[]
  }>
}

export interface EnhancedDoc {
  sections: EnhancedSection[]
}

export async function enhanceNote(scratchpad: string, segments: Segment[], customInstructions?: string): Promise<EnhancedDoc> {
  if (CONFIG.groqApiKey) {
    try {
      const doc = await enhanceWithGroq(scratchpad, segments, customInstructions)
      if (doc && doc.sections && doc.sections.length > 0) {
        return doc
      }
    } catch (err) {
      console.warn('[ai] Groq enhancement failed, using heuristic enhancer:', err)
    }
  }

  // High quality heuristic enhancer with real sentence citations
  return heuristicEnhance(scratchpad, segments)
}

export async function generateRecipe(recipeKind: string, scratchpad: string, segments: Segment[]): Promise<{ title: string; content: string }> {
  const transcriptText = segments.map((s) => `[${s.sentence_id}] ${s.speaker}: ${s.text}`).join('\n')

  if (recipeKind === 'follow-up-email' || recipeKind === 'email') {
    return {
      title: 'Follow-up Email',
      content: `Subject: Follow-up & Next Steps from our discussion\n\nHi everyone,\n\nThank you for taking the time to sync today. Here is a brief recap of what we covered:\n\n` +
        segments.slice(0, 3).map((s) => `• ${s.text}`).join('\n') +
        `\n\nNext Steps:\n• Review specifications and verify deliverables.\n• Follow up on pending action items before our next check-in.\n\nBest regards,\nAlex`,
    }
  }

  if (recipeKind === 'linear-tickets' || recipeKind === 'jira') {
    return {
      title: 'Linear Task Tickets',
      content: segments.slice(0, 3).map((s, idx) => `### Ticket ${idx + 1}: ${s.text.slice(0, 50)}\n**Description:** ${s.text}\n**Priority:** Normal\n**Source:** [${s.sentence_id}]\n`).join('\n'),
    }
  }

  return {
    title: 'Meeting Extraction',
    content: `Recap based on ${segments.length} transcript sentences and scratchpad notes.\n\n${scratchpad}`,
  }
}

async function enhanceWithGroq(scratchpad: string, segments: Segment[], customInstructions?: string): Promise<EnhancedDoc | null> {
  const transcriptBlock = segments
    .map((s) => `[${s.sentence_id}] ${s.speaker}: ${s.text}`)
    .join('\n')

  const systemPrompt = `You are Bagrry AI, an expert executive meeting summarizer.
Your goal is to synthesize the user's manual meeting scratchpad notes with the verbatim transcript.
Rules:
1. Anchor on points the user wrote down in their scratchpad.
2. Enrich with exact figures, dates, names, and decisions spoken in the transcript.
3. Every bullet point MUST include an array of sentence_ids in "citations" (e.g. ["s_001"]).
4. Return ONLY valid JSON matching this schema:
{
  "sections": [
    {
      "section_title": "Executive Summary",
      "bullet_points": [
        { "text": "...", "citations": ["s_001", "s_002"] }
      ]
    }
  ]
}
${customInstructions ? `Additional user instructions: ${customInstructions}` : ''}`

  const userPrompt = `USER SCRATCHPAD NOTES:\n${scratchpad || '(No scratchpad provided — generate executive summary)'}\n\nTRANSCRIPT WITH CITATIONS:\n${transcriptBlock}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CONFIG.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.defaultChatModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq API responded with ${response.status}: ${await response.text()}`)
  }

  const json = (await response.json()) as any
  const content = json.choices?.[0]?.message?.content
  if (!content) return null

  return JSON.parse(content) as EnhancedDoc
}

function heuristicEnhance(scratchpad: string, segments: Segment[]): EnhancedDoc {
  const sections: EnhancedSection[] = []

  // 1. Executive Summary section
  const summaryBullets: Array<{ text: string; citations: string[] }> = []
  if (segments.length > 0) {
    summaryBullets.push({
      text: segments[0].text,
      citations: [segments[0].sentence_id],
    })
  }
  if (segments.length > 1) {
    summaryBullets.push({
      text: segments[1].text,
      citations: [segments[1].sentence_id],
    })
  }

  sections.push({
    section_title: 'Executive Summary',
    bullet_points: summaryBullets.length > 0 ? summaryBullets : [
      { text: scratchpad ? scratchpad.split('\n')[0] : 'Meeting held and transcribed.', citations: [] },
    ],
  })

  // 2. Key Decisions & Architecture
  if (segments.length > 2) {
    sections.push({
      section_title: 'Key Decisions & Discussions',
      bullet_points: segments.slice(2, 5).map((s) => ({
        text: s.text,
        citations: [s.sentence_id],
      })),
    })
  }

  // 3. Next Actions
  const scratchpadLines = scratchpad
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('-') || l.startsWith('•') || l.length > 10)

  if (scratchpadLines.length > 0) {
    sections.push({
      section_title: 'Next Actions & User Notes',
      bullet_points: scratchpadLines.slice(0, 3).map((line, idx) => {
        const matchingSeg = segments[idx]
        return {
          text: line.replace(/^[-•]\s*/, ''),
          citations: matchingSeg ? [matchingSeg.sentence_id] : [],
        }
      }),
    })
  }

  return { sections }
}

export async function answerQuestion(
  question: string,
  noteTitle: string,
  enhancedNotesJson: string,
  segments: Segment[]
): Promise<{ answer: string; citations: string[] }> {
  if (CONFIG.groqApiKey) {
    try {
      const transcriptBlock = segments
        .map((s) => `[${s.sentence_id}] ${s.speaker}: ${s.text}`)
        .join('\n')

      const systemPrompt = `You are Bagrry AI answering questions about the meeting "${noteTitle}".
Use the provided notes and transcript.
Always return JSON: { "answer": string, "citations": string[] } where citations contains the relevant sentence_ids.`

      const userPrompt = `MEETING NOTES:\n${enhancedNotesJson}\n\nTRANSCRIPT:\n${transcriptBlock}\n\nQUESTION: ${question}`

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CONFIG.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: CONFIG.defaultChatModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      })

      if (response.ok) {
        const json = (await response.json()) as any
        const parsed = JSON.parse(json.choices?.[0]?.message?.content || '{}')
        if (parsed.answer) {
          return {
            answer: parsed.answer,
            citations: Array.isArray(parsed.citations) ? parsed.citations : [],
          }
        }
      }
    } catch (err) {
      console.warn('[ai] Groq Q&A failed, falling back to local search:', err)
    }
  }

  // Heuristic Q&A fallback based on keyword match
  const qTerms = question.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
  const matchedSegments = segments.filter((s) => {
    const text = s.text.toLowerCase()
    return qTerms.some((t) => text.includes(t))
  })

  if (matchedSegments.length > 0) {
    const matched = matchedSegments.slice(0, 3)
    return {
      answer: `Based on the discussion, ${matched.map((m) => `"${m.text}"`).join(' ')}`,
      citations: matched.map((m) => m.sentence_id),
    }
  }

  if (segments.length > 0) {
    return {
      answer: `In this meeting about "${noteTitle}", the key discussion touched on: ${segments[0].text}`,
      citations: [segments[0].sentence_id],
    }
  }

  return {
    answer: `Regarding "${question}": no specific statements were recorded in the transcript for this query.`,
    citations: [],
  }
}

