/** Real native window + daemon + child CLI. No account access or paid calls. */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { openWindow, waitUntil, treeText, stopTheDaemon } from './integration'
import { readRegistry, localPaths } from './src/engine/discovery'
import { engineClient } from './src/engine/client'
import { saveWindowState } from './src/shell/state'

const root = mkdtempSync(path.join(tmpdir(), 'hiroshi-cli-window-'))
const home = path.join(root, 'engine'), cwd = path.join(root, 'project'), native = path.join(root, 'native'), entry = path.join(root, 'agent.ts')
for (const dir of [home, cwd, native]) mkdirSync(dir)
const git = Bun.spawnSync(['git', '-C', cwd, 'init', '-b', 'main'])
if (git.exitCode) throw new Error('Could not create the temporary project')
writeFileSync(path.join(cwd, 'AGENTS.md'), 'Fixed response-only window fixture instructions')
writeFileSync(entry, `await import(${JSON.stringify(pathToFileURL(path.join(import.meta.dir, 'engine/test/fixtures/cli-continuation.ts')).href)})`)
writeFileSync(path.join(home, 'providers.json'), JSON.stringify({ defaultModel: 'agent/chat', providers: [{ id: 'agent', adapter: 'cursor-cli', command: [process.execPath, entry],
  models: [{ id: 'chat', model: 'fixture-model', label: 'Native fixture', contextWindow: 32768, reservedOutput: 1024 }] }] }))
writeFileSync(path.join(home, 'execution.json'), JSON.stringify({ maxActive: 1, minFreeMemoryMB: 128, processMemoryMB: 512, maxProcesses: 4, timeoutMs: 30000 }))
saveWindowState(cwd, { width: 1024, height: 642, x: 60, y: 60, surface: 'terminal', panelOpen: true }, home)
const env = { HIROSHI_HOME: home, GPUIX_BACKGROUND: '1', HIROSHI_NATIVE_ROOT: native, HIROSHI_CONTINUATION_ADAPTER: 'cursor' }
const calls = () => readFileSync(path.join(native, 'calls.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line))
const check = (value: unknown, message: string) => { if (!value) throw new Error(message) }
try {
  const window = await openWindow(env, cwd)
  try {
    const app = window.app
    const registry = await waitUntil(async () => readRegistry(localPaths(home).registry), 'the owned daemon')
    const client = engineClient(registry)
    await waitUntil(async () => !(await app.getByTestId('engine-run-status').textContent()).includes('Connecting'), 'the connected task')
    const task = (await client.listSessions()).sessions.find((item) => item.cwd === cwd)!
    const send = async (text: string) => { await app.getByTestId('composer').fill(text); await app.getByTestId('composer').press('enter') }
    await send('remember window nonce')
    await waitUntil(async () => (await client.session({ id: task.id })).cliConversation?.status === 'ready', 'the first native response')
    await app.getByTestId('cli-conversation-status').waitFor()
    await send('follow up in native history')
    await waitUntil(async () => (await client.session({ id: task.id })).steps.filter((step) => step.status === 'succeeded').length === 2, 'native follow-up')
    check(calls()[1].resumed && calls()[0].id === calls()[1].id, 'the window did not resume its native conversation')
    writeFileSync(path.join(native, 'control.json'), JSON.stringify({ missing: true }))
    await send('simulate expired native history')
    await waitUntil(async () => (await app.getByTestId('cli-conversation-status').textContent()).includes('fresh conversation required'), 'the recovery UI')
    const count = calls().length
    await send('a deliberate new prompt after recovery')
    check(calls().length === count, 'blocked composer invoked the CLI')
    writeFileSync(path.join(native, 'control.json'), '{}')
    await app.getByTestId('terminal-input').waitFor()
    const button = await app.getByTestId('cli-fresh').bounds(), terminal = await app.getByTestId('terminal-input').bounds()
    check(button.x + button.width <= terminal.x, 'the recovery control is clipped behind the terminal drawer')
    mkdirSync('screenshots', { recursive: true })
    await app.screenshot({ path: path.resolve('screenshots/windowed-cli-recovery.png') })
    await app.getByTestId('cli-fresh').click()
    await waitUntil(async () => !(await treeText(app)).includes('fresh conversation required'), 'deliberate fresh recovery')
    await app.getByTestId('composer').press('enter')
    await waitUntil(async () => (await client.session({ id: task.id })).cliConversation?.status === 'ready', 'the fresh native response')
    check(calls().length === count + 1 && !calls().at(-1).resumed && calls().at(-1).id !== calls()[0].id, 'fresh recovery replayed or reused the expired session')
    check((await treeText(app)).includes('remember window nonce'), 'recovery removed the saved Hiroshi transcript')
  } finally { await window.close() }
  console.log('CLI window passed: native follow-up, expired history, blocked send and explicit recovery without replay.')
} finally { await stopTheDaemon(home) }
