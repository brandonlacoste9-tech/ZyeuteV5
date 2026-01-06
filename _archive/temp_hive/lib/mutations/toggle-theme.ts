import fs from 'fs/promises'
import path from 'path'

const targetCss = path.resolve(process.cwd(), 'public', 'mutations', 'active.css')

const css = `/* toggle-theme mutation */
:root {
  --void: #050710;
  --ink: #0b1224;
  --indigo: #7a7aff;
  --cyan: #38e8ff;
  --amber: #f7c96a;
  --emerald: #46f2b5;
  --text-primary: #f6f8ff;
  --text-dim: #a9b4dd;
}
body {
  background: radial-gradient(140% 140% at 50% 0%, rgba(122, 122, 255, 0.12), transparent),
              radial-gradient(80% 70% at 10% 10%, rgba(70, 242, 181, 0.08), transparent),
              radial-gradient(90% 80% at 90% 20%, rgba(56, 232, 255, 0.10), transparent),
              #050710;
}
`

async function apply() {
  await fs.mkdir(path.dirname(targetCss), { recursive: true })
  await fs.writeFile(targetCss, css, 'utf8')
  console.log(`[toggle-theme] applied -> ${targetCss}`)
}

async function revert() {
  await fs.rm(targetCss, { force: true })
  console.log(`[toggle-theme] reverted (removed ${targetCss})`)
}

async function main() {
  const isRevert = process.argv.includes('--revert')
  if (isRevert) return revert()
  return apply()
}

main().catch((err) => {
  console.error('[toggle-theme] failed', err)
  process.exitCode = 1
})
