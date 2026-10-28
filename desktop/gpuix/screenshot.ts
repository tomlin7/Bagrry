import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { launch } from '@gpuix/react/automation'

const outDir = path.resolve('screenshots')
mkdirSync(outDir, { recursive: true })

try {
  const app = await launch({
    command: process.execPath,
    args: [path.resolve('app.tsx')],
    cwd: process.cwd(),
    env: { GPUIX_BACKGROUND: '1' },
  })

  const capture = async (name: string) => {
    await Bun.sleep(500)
    await app.screenshot({ path: path.join(outDir, `${name}.png`) })
    console.log(`[screenshot] wrote ${name}.png`)
  }

  try {
    // 1. Home screen
    await app.getByTestId('bagrry-root').waitFor({ timeoutMs: 60_000 })
    await capture('bagrry-home')

    // 2. Open Note & Scratchpad
    await app.getByTestId('note-row-note_roadmap_sync').click()
    await Bun.sleep(400)
    await capture('bagrry-note-editor')

    // 3. Switch to Enhanced Notes
    await app.getByTestId('tab-enhanced').click()
    await Bun.sleep(400)
    await capture('bagrry-enhanced-notes')

    // 4. Chat Page
    await app.getByTestId('nav-chat').click()
    await Bun.sleep(400)
    await capture('bagrry-chat')

    // 5. People Directory
    await app.getByTestId('footer-people').click()
    await Bun.sleep(400)
    await capture('bagrry-directory-people')

    // 6. Settings Page
    await app.getByTestId('user-profile-button').click()
    await Bun.sleep(400)
    await capture('bagrry-settings')
  } finally {
    await app.close()
  }
} catch (err) {
  console.error('[screenshot] failed:', err)
}
