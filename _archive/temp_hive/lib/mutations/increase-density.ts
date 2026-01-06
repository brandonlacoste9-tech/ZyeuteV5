import fs from 'fs/promises'
import path from 'path'

const targetCss = path.resolve(process.cwd(), 'public', 'mutations', 'active.css')

const css = `/* increase-density mutation */
:root {
  --density-multiplier: 0.92;
}
body, body * { letter-spacing: -0.01em; }
section, div, header, main, footer, article {
  padding: calc(1rem * var(--density-multiplier)) !important;
  gap: calc(0.9rem * var(--density-multiplier));
}
h1, h2, h3, h4, h5, h6 { margin: 0.6em 0 0.35em; }
button, input, textarea {
  padding: calc(0.65rem * var(--density-multiplier)) calc(0.9rem * var(--density-multiplier)) !important;
}
`

async function apply() {
  await fs.mkdir(path.dirname(targetCss), { recursive: true })
  await fs.writeFile(targetCss, css, 'utf8')
  console.log(`[increase-density] applied -> ${targetCss}`)
}

async function revert() {
  await fs.rm(targetCss, { force: true })
  console.log(`[increase-density] reverted (removed ${targetCss})`)
}

async function main() {
  const isRevert = process.argv.includes('--revert')
  if (isRevert) return revert()
  return apply()
}

main().catch((err) => {
  console.error('[increase-density] failed', err)
  process.exitCode = 1
})
