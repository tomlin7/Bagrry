import type { Database } from 'bun:sqlite'
import type { JsonRpcRequest, JsonRpcResponse } from './types'
import { MCP_TOOLS, executeMcpTool } from './tools'

export async function handleMcpRequest(req: Request, db: Database, workspaceId = 'ws_default'): Promise<Response> {
  let body: JsonRpcRequest
  try {
    body = (await req.json()) as JsonRpcRequest
  } catch {
    return Response.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error: invalid JSON' },
    } as JsonRpcResponse, { status: 400 })
  }

  const { id = null, method, params } = body

  // Notification (no ID)
  if (method === 'notifications/initialized') {
    return new Response(null, { status: 204 })
  }

  // 1. initialize
  if (method === 'initialize') {
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'bagrry-mcp-server',
          version: '1.0.0',
        },
      },
    }
    return Response.json(response)
  }

  // 2. ping
  if (method === 'ping') {
    return Response.json({
      jsonrpc: '2.0',
      id,
      result: {},
    } as JsonRpcResponse)
  }

  // 3. tools/list
  if (method === 'tools/list') {
    return Response.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: MCP_TOOLS,
      },
    } as JsonRpcResponse)
  }

  // 4. tools/call
  if (method === 'tools/call') {
    const toolName = params?.name
    const toolArgs = params?.arguments || {}

    if (!toolName) {
      return Response.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: 'Invalid params: tool name required' },
      } as JsonRpcResponse, { status: 400 })
    }

    const result = await executeMcpTool(db, workspaceId, toolName, toolArgs)
    return Response.json({
      jsonrpc: '2.0',
      id,
      result,
    } as JsonRpcResponse)
  }

  // Unknown method
  return Response.json({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  } as JsonRpcResponse, { status: 404 })
}
