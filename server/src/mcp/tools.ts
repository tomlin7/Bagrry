import type { Database } from 'bun:sqlite'
import type { McpToolDefinition, McpToolCallResult } from './types'

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'query_meetings',
    description: 'Search across meeting titles, notes, enhanced summaries, and transcripts with keyword matching.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms or question to match in meetings and transcripts.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default 10).',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_meetings',
    description: 'List recent meetings and executive notes with dates, duration, and folder names.',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'Optional folder ID to filter meetings.',
        },
        limit: {
          type: 'number',
          description: 'Number of meetings to retrieve (default 20).',
        },
      },
    },
  },
  {
    name: 'get_meeting',
    description: 'Retrieve detailed information for a specific meeting note, including enhanced summary, bullet points, citations, and action items.',
    inputSchema: {
      type: 'object',
      properties: {
        meeting_id: {
          type: 'string',
          description: 'The unique ID of the meeting note.',
        },
      },
      required: ['meeting_id'],
    },
  },
  {
    name: 'get_meeting_transcript',
    description: 'Retrieve the raw timestamped and speaker-labeled transcript segments with sentence IDs for citations.',
    inputSchema: {
      type: 'object',
      properties: {
        meeting_id: {
          type: 'string',
          description: 'The unique ID of the meeting note.',
        },
      },
      required: ['meeting_id'],
    },
  },
  {
    name: 'list_folders',
    description: 'List all folders and spaces in the Bagrry workspace.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'search_action_items',
    description: 'Search action items across all meetings, optionally filtered by status (pending or completed).',
    inputSchema: {
      type: 'object',
      properties: {
        pending_only: {
          type: 'boolean',
          description: 'If true, only return uncompleted action items.',
        },
        meeting_id: {
          type: 'string',
          description: 'Optional meeting ID filter.',
        },
      },
    },
  },
]

export async function executeMcpTool(
  db: Database,
  workspaceId: string,
  name: string,
  args: any = {}
): Promise<McpToolCallResult> {
  try {
    switch (name) {
      case 'query_meetings': {
        const query = (args.query || '').trim()
        const limit = Math.min(args.limit || 10, 50)
        const term = `%${query}%`

        const notes = db.query(`
          SELECT n.id, n.title, n.date, f.name as folder_name, n.scratchpad_raw
          FROM notes n
          LEFT JOIN folders f ON f.id = n.folder_id
          WHERE n.workspace_id = ?
            AND (n.title LIKE ? OR n.scratchpad_raw LIKE ? OR n.enhanced_notes_json LIKE ?)
          ORDER BY n.date DESC
          LIMIT ?
        `).all(workspaceId, term, term, term, limit) as any[]

        const transcriptMatches = db.query(`
          SELECT ts.note_id, ts.speaker, ts.text, ts.sentence_id, n.title as note_title
          FROM transcript_segments ts
          JOIN notes n ON n.id = ts.note_id
          WHERE n.workspace_id = ? AND ts.text LIKE ?
          ORDER BY ts.start_ms ASC
          LIMIT ?
        `).all(workspaceId, term, limit) as any[]

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query,
                matched_notes: notes,
                matched_transcript_segments: transcriptMatches,
              }, null, 2),
            },
          ],
        }
      }

      case 'list_meetings': {
        const limit = Math.min(args.limit || 20, 100)
        const folderId = args.folder_id

        let sql = `
          SELECT n.id, n.title, n.date, n.duration_ms, f.name as folder_name,
            (SELECT COUNT(*) FROM action_items WHERE note_id = n.id AND done = 0) as pending_actions
          FROM notes n
          LEFT JOIN folders f ON f.id = n.folder_id
          WHERE n.workspace_id = ?
        `
        const params: any[] = [workspaceId]
        if (folderId) {
          sql += ' AND n.folder_id = ?'
          params.push(folderId)
        }
        sql += ' ORDER BY n.date DESC LIMIT ?'
        params.push(limit)

        const meetings = db.query(sql).all(...params)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: meetings.length, meetings }, null, 2),
            },
          ],
        }
      }

      case 'get_meeting': {
        const meetingId = args.meeting_id
        if (!meetingId) {
          return { content: [{ type: 'text', text: 'Error: meeting_id is required' }], isError: true }
        }

        const note = db.query(`
          SELECT n.*, f.name as folder_name
          FROM notes n
          LEFT JOIN folders f ON f.id = n.folder_id
          WHERE n.id = ? AND n.workspace_id = ?
        `).get(meetingId, workspaceId) as any

        if (!note) {
          return { content: [{ type: 'text', text: `Error: meeting not found with id ${meetingId}` }], isError: true }
        }

        const actions = db.query('SELECT * FROM action_items WHERE note_id = ?').all(meetingId)
        const enhanced = note.enhanced_notes_json ? JSON.parse(note.enhanced_notes_json) : null

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                id: note.id,
                title: note.title,
                date: note.date,
                duration_ms: note.duration_ms,
                folder: note.folder_name,
                scratchpad: note.scratchpad_raw,
                enhanced_summary: enhanced,
                action_items: actions,
              }, null, 2),
            },
          ],
        }
      }

      case 'get_meeting_transcript': {
        const meetingId = args.meeting_id
        if (!meetingId) {
          return { content: [{ type: 'text', text: 'Error: meeting_id is required' }], isError: true }
        }

        const segments = db.query(`
          SELECT ts.id, ts.speaker, ts.start_ms, ts.end_ms, ts.text, ts.sentence_id
          FROM transcript_segments ts
          JOIN notes n ON n.id = ts.note_id
          WHERE ts.note_id = ? AND n.workspace_id = ?
          ORDER BY ts.start_ms ASC
        `).all(meetingId, workspaceId)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ meeting_id: meetingId, segments_count: segments.length, segments }, null, 2),
            },
          ],
        }
      }

      case 'list_folders': {
        const folders = db.query(`
          SELECT f.*, (SELECT COUNT(*) FROM notes WHERE folder_id = f.id) as note_count
          FROM folders f
          WHERE f.workspace_id = ?
          ORDER BY f.name ASC
        `).all(workspaceId)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ folders }, null, 2),
            },
          ],
        }
      }

      case 'search_action_items': {
        const pendingOnly = args.pending_only !== false
        const meetingId = args.meeting_id

        let sql = `
          SELECT a.*, n.title as meeting_title
          FROM action_items a
          JOIN notes n ON n.id = a.note_id
          WHERE n.workspace_id = ?
        `
        const params: any[] = [workspaceId]

        if (pendingOnly) {
          sql += ' AND a.done = 0'
        }
        if (meetingId) {
          sql += ' AND a.note_id = ?'
          params.push(meetingId)
        }

        sql += ' ORDER BY a.created_at DESC'
        const items = db.query(sql).all(...params)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ count: items.length, action_items: items }, null, 2),
            },
          ],
        }
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        }
    }
  } catch (err: any) {
    return {
      content: [{ type: 'text', text: `Tool execution error: ${err?.message || String(err)}` }],
      isError: true,
    }
  }
}
