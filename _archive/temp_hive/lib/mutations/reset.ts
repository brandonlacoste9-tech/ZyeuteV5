import fs from 'fs/promises'
import path from 'path'

const targetCss = path.resolve(process.cwd(), 'public', 'mutations', 'active.css')

async function reset() {
  await fs.rm(targetCss, { force: true })
  console.log(`[reset] removed ${targetCss}`)
}

reset().catch((err) => {
  console.error('[reset] failed', err)
  process.exitCode = 1
})
