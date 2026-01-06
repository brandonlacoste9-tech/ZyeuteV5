import fs from 'fs/promises'
import path from 'path'

const targetCss = path.resolve(process.cwd(), 'public', 'mutations', 'active.css')

const css = `/* reduce-motion mutation */
*,
*::before,
*::after {
  animation: none !important;
  transition: none !important;
  scroll-behavior: auto !important;
}
html {
  scroll-behavior: auto !important;
}
`

async function apply() {
  await fs.mkdir(path.dirname(targetCss), { recursive: true })
  await fs.writeFile(targetCss, css, 'utf8')
  console.log(`[reduce-motion] applied -> ${targetCss}`)
}

async function revert() {
  await fs.rm(targetCss, { force: true })
  console.log(`[reduce-motion] reverted (removed ${targetCss})`)
}

async function main() {
  const isRevert = process.argv.includes('--revert')
  if (isRevert) return revert()
  return apply()
}

main().catch((err) => {
  console.error('[reduce-motion] failed', err)
  process.exitCode = 1
})
