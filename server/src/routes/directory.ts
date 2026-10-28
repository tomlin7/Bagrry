import type { Database } from 'bun:sqlite'
import type { AuthContext } from '../auth/middleware'

export async function handleDirectoryRoutes(req: Request, db: Database, ctx: AuthContext): Promise<Response | null> {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // 1. GET /v1/people
  if (method === 'GET' && path === '/v1/people') {
    const people = db.query(`
      SELECT p.*, c.name as company_name
      FROM people p
      LEFT JOIN companies c ON c.id = p.company_id
      WHERE p.workspace_id = ?
      ORDER BY p.name ASC
    `).all(ctx.workspaceId)

    return Response.json({ people })
  }

  // 2. POST /v1/people
  if (method === 'POST' && path === '/v1/people') {
    const body = await req.json().catch(() => ({})) as any
    const name = (body.name || '').trim()
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    const id = body.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const email = body.email || null
    const domain = body.domain || (email ? email.split('@')[1] : null)
    const companyId = body.company_id || null

    db.run(`
      INSERT INTO people (id, workspace_id, name, email, domain, company_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, ctx.workspaceId, name, email, domain, companyId])

    const created = db.query('SELECT * FROM people WHERE id = ?').get(id)
    return Response.json({ person: created }, { status: 201 })
  }

  // 3. GET /v1/companies
  if (method === 'GET' && path === '/v1/companies') {
    const companies = db.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM people WHERE company_id = c.id) as people_count
      FROM companies c
      WHERE c.workspace_id = ?
      ORDER BY c.name ASC
    `).all(ctx.workspaceId)

    return Response.json({ companies })
  }

  // 4. POST /v1/companies
  if (method === 'POST' && path === '/v1/companies') {
    const body = await req.json().catch(() => ({})) as any
    const name = (body.name || '').trim()
    if (!name) {
      return Response.json({ error: 'Company name is required' }, { status: 400 })
    }

    const id = body.id || `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    const domain = body.domain || null

    db.run(`
      INSERT INTO companies (id, workspace_id, name, domain)
      VALUES (?, ?, ?, ?)
    `, [id, ctx.workspaceId, name, domain])

    const created = db.query('SELECT * FROM companies WHERE id = ?').get(id)
    return Response.json({ company: created }, { status: 201 })
  }

  return null
}
