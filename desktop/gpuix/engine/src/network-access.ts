import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs'
import { hostname } from 'node:os'
import { join } from 'node:path'
import { conflict, invalid } from './errors'
import type { NetworkSettings, NetworkUpdate } from './protocol'

interface Saved { version: 1; revision: number; enabled: boolean; port: number; origins: string[]; token: string }
const equal = (a: string, b: string) => { const left = Buffer.from(a), right = Buffer.from(b); return left.length === right.length && timingSafeEqual(left, right) }
const localOnly = new Set(['/v1/network', '/v1/network/settings', '/v1/network/token', '/v1/network/rotate', '/v1/shutdown'])

export function networkOrigins(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 32) throw invalid('network_origins', 'Provide at most 32 exact HTTP or HTTPS origins.')
  return [...new Set(value.map((origin: unknown) => {
    if (typeof origin !== 'string' || origin.length > 2048) throw invalid('network_origins', 'Browser origins must be exact HTTP or HTTPS origins.')
    let url: URL
    try { url = new URL(origin) } catch { throw invalid('network_origins', 'Browser origins must be exact HTTP or HTTPS origins.') }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash || origin.includes('*')) {
      throw invalid('network_origins', 'Origins cannot contain paths, credentials, queries, fragments or wildcards.')
    }
    return url.origin
  }))]
}

/** A separate listener and credential. Configuration is available only through
 * the private loopback server; no token enters discovery, health, or the feed. */
export class NetworkAccess {
  #saved: Saved = { version: 1, revision: 0, enabled: false, port: 34123, origins: [], token: randomBytes(32).toString('hex') }
  #server: ReturnType<typeof Bun.serve> | null = null
  #error: string | null = null
  #invalid = false
  readonly #file: string
  constructor(home: string, readonly dispatch: (request: Request) => Promise<Response>, readonly localToken: string) {
    this.#file = join(home, 'network.json')
    try {
      const raw = readFileSync(this.#file, 'utf8')
      if (raw.length > 128 * 1024) throw new Error('size')
      const value = JSON.parse(raw) as Saved
      if (value.version !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 0 || !/^[a-f0-9]{64}$/.test(value.token)) throw new Error('shape')
      this.#validate(value)
      this.#saved = { ...value, origins: networkOrigins(value.origins) }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        try { this.#persist(this.#saved) } catch { this.#invalid = true; this.#error = 'Could not save network credentials. Network access is disabled; local access remains available.' }
      }
      else { this.#invalid = true; this.#error = 'Saved network configuration is invalid and has been preserved. Network access is disabled.' }
    }
    if (this.#saved.enabled && !this.#invalid) {
      try { this.#server = this.#listen(this.#saved) } catch { this.#error = `Could not listen on port ${this.#saved.port}. Local access is still available.` }
    }
  }
  #validate(input: Pick<Saved, 'enabled' | 'port' | 'origins'>) {
    if (typeof input.enabled !== 'boolean' || !Number.isInteger(input.port) || input.port < 1024 || input.port > 65535) {
      throw invalid('network_settings', 'Choose a port between 1024 and 65535 and an explicit exposure setting.')
    }
    networkOrigins(input.origins)
  }
  #persist(saved: Saved) {
    const temporary = `${this.#file}.${randomUUID()}.tmp`
    try { writeFileSync(temporary, JSON.stringify(saved), { flag: 'wx', mode: 0o600 }); renameSync(temporary, this.#file) }
    finally { try { unlinkSync(temporary) } catch {} }
  }
  #listen(saved: Saved) {
    return Bun.serve({ hostname: '0.0.0.0', port: saved.port, maxRequestBodySize: 2 * 1024 * 1024, idleTimeout: 60,
      fetch: async (request: Request) => {
        const url = new URL(request.url), origin = request.headers.get('origin')
        const deny = (status: number, message: string) => Response.json({ error: { code: 'network_access', message } }, { status })
        if (localOnly.has(url.pathname)) return deny(403, 'This operation is available only through the private local listener.')
        if (origin !== null && !saved.origins.includes(origin)) return deny(403, 'This browser origin is not allowed.')
        const cors: Record<string, string> = { 'cache-control': 'no-store', vary: 'Origin' }
        if (origin) cors['access-control-allow-origin'] = origin
        if (request.method === 'OPTIONS') {
          const method = request.headers.get('access-control-request-method')
          const headers = (request.headers.get('access-control-request-headers') ?? '').toLowerCase().split(',').map((value) => value.trim()).filter(Boolean)
          if (!origin || !['GET', 'POST'].includes(method ?? '') || headers.some((name) => !['authorization', 'content-type'].includes(name))) return deny(403, 'Unsupported browser preflight.')
          return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, POST', 'access-control-allow-headers': 'authorization, content-type' } })
        }
        const credential = request.headers.get('authorization') ?? ''
        let response: Response
        if (!equal(credential, `Bearer ${saved.token}`)) response = deny(401, 'A network bearer token is required.')
        else {
          const headers = new Headers(request.headers); headers.set('authorization', `Bearer ${this.localToken}`)
          response = await this.dispatch(new Request(request, { headers }))
        }
        for (const [key, value] of Object.entries(cors)) response.headers.set(key, value)
        return response
      },
    })
  }
  snapshot(): NetworkSettings {
    return { revision: this.#saved.revision, enabled: this.#saved.enabled, active: !!this.#server, port: this.#saved.port,
      origins: [...this.#saved.origins], urls: this.#server ? [`http://${hostname()}:${this.#saved.port}`] : [], error: this.#error,
      transport: 'HTTP / Server-Sent Events' }
  }
  token() { return this.#saved.token }
  update(input: NetworkUpdate, rotate = false): NetworkSettings {
    if (this.#invalid) throw invalid('network_configuration', this.#error!)
    if (input.revision !== this.#saved.revision) throw conflict('network_revision', 'Network settings changed. Refresh before applying your changes.')
    this.#validate(input)
    const next: Saved = { version: 1, revision: this.#saved.revision + 1, enabled: input.enabled, port: input.port,
      origins: networkOrigins(input.origins), token: rotate ? randomBytes(32).toString('hex') : this.#saved.token }
    const old = this.#server, previous = this.#saved
    let candidate: typeof old = null, stoppedOld = false
    try {
      if (old && next.enabled && next.port === previous.port) { old.stop(true); stoppedOld = true }
      if (next.enabled) candidate = this.#listen(next)
      this.#persist(next)
      if (old && !stoppedOld) old.stop(true)
      this.#saved = next; this.#server = candidate; this.#error = null
    } catch {
      candidate?.stop(true)
      if (stoppedOld) {
        try { this.#server = this.#listen(previous) } catch { this.#server = null; this.#error = 'The network listener could not be restored. Local access remains available.' }
      }
      throw invalid('network_apply', `Could not apply network settings on port ${next.port}. Check port availability and file permissions; previous settings were retained.`)
    }
    return this.snapshot()
  }
  rotate(revision: number) { return this.update({ ...this.#saved, revision }, true) }
  close() { this.#server?.stop(true); this.#server = null }
}
