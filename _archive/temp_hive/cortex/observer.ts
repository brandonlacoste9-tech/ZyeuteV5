import fs from 'fs/promises'
import path from 'path'
import { chromium, BrowserContext } from 'playwright'

type ObserverConfig = {
  targetUrl: string
  readySelector: string
  outputDir: string
  tag?: string
  waitAfterLoadMs: number
  headless: boolean
  viewport: { width: number; height: number }
}

export type ObservationMetrics = {
  loadTimeMs?: number
  domCompleteMs?: number
  domInteractiveMs?: number
  fcpMs?: number
  domNodes?: number
  layoutShift?: number
  viscosity?: number
  resonance?: string
}

type ObservationResult = {
  screenshotPath: string
  htmlPath: string
  url: string
  logPath?: string
  metrics?: ObservationMetrics
}

const DEFAULT_CONFIG: ObserverConfig = {
  targetUrl: process.env.OBSERVER_URL || 'http://localhost:3000',
  readySelector: process.env.OBSERVER_READY_SELECTOR || 'main',
  outputDir: process.env.OBSERVER_OUTPUT_DIR || path.join(process.cwd(), 'public', 'memories'),
  tag: process.env.OBSERVER_TAG,
  waitAfterLoadMs: parseInt(process.env.OBSERVER_WAIT_AFTER_LOAD_MS || '1500', 10),
  headless: process.env.OBSERVER_HEADLESS === 'false' ? false : true,
  viewport: { width: 1440, height: 900 },
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function captureMetrics(page: import('playwright').Page, loadStart: number): Promise<ObservationMetrics> {
  const navMetrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const paints = performance.getEntriesByType('paint') as PerformanceEntry[]
    const fcp = paints.find((p) => p.name === 'first-contentful-paint')?.startTime ?? null
    const domNodes = document.getElementsByTagName('*').length
    return {
      loadTimeMs: nav ? nav.duration : null,
      domCompleteMs: nav?.domComplete ?? null,
      domInteractiveMs: nav?.domInteractive ?? null,
      fcpMs: fcp,
      domNodes,
      layoutShift: 0,
    }
  })

  const loadFallback = Date.now() - loadStart
  const loadTimeMs = navMetrics.loadTimeMs ?? loadFallback
  const domNodes = navMetrics.domNodes ?? 0
  const viscosity = Math.min(loadTimeMs / 2000 + domNodes / 5000, 1)
  const resonance = loadTimeMs < 1000 ? 'TRANSCENDENT' : loadTimeMs < 2000 ? 'NOMINAL' : 'VISCOUS'

  return {
    ...navMetrics,
    loadTimeMs,
    viscosity: Number(viscosity.toFixed(2)),
    resonance,
  }
}

export async function observe(config: Partial<ObserverConfig> = {}): Promise<ObservationResult> {
  const resolved: ObserverConfig = { ...DEFAULT_CONFIG, ...config }
  const outputDir = path.resolve(resolved.outputDir)
  await ensureDir(outputDir)

  const browser = await chromium.launch({ headless: resolved.headless })
  let context: BrowserContext | null = null

  try {
    context = await browser.newContext({ viewport: resolved.viewport })
    const page = await context.newPage()

    const loadStart = Date.now()
    await page.goto(resolved.targetUrl, { waitUntil: 'networkidle' })
    if (resolved.readySelector) await page.waitForSelector(resolved.readySelector, { timeout: 20000 })
    if (resolved.waitAfterLoadMs > 0) await page.waitForTimeout(resolved.waitAfterLoadMs)

    const metrics = await captureMetrics(page, loadStart)

    const tag = resolved.tag ? `${resolved.tag}-` : ''
    const baseName = `${tag}${timestampSlug()}`
    const screenshotPath = path.join(outputDir, `${baseName}.png`)
    const htmlPath = path.join(outputDir, `${baseName}.html`)

    await page.screenshot({ path: screenshotPath, fullPage: true })
    await fs.writeFile(htmlPath, await page.content(), 'utf8')

    const logPath = process.env.OBSERVER_LOG_PATH || path.join(process.cwd(), 'lib', 'cortex-logs.json')
    await appendLog(logPath, {
      id: `obs-${Date.now()}`,
      timestamp: new Date().toISOString(),
      url: resolved.targetUrl,
      screenshotPath,
      htmlPath,
      tag: resolved.tag,
      status: 'SUCCESS',
      metrics,
    })

    return { screenshotPath, htmlPath, url: resolved.targetUrl, logPath, metrics }
  } finally {
    await context?.close()
    await browser.close()
  }
}

async function appendLog(logPath: string, entry: Record<string, unknown>) {
  const logDir = path.dirname(logPath)
  await ensureDir(logDir)
  let existing: unknown[] = []
  try {
    const content = await fs.readFile(logPath, 'utf8')
    existing = JSON.parse(content)
  } catch {
    existing = []
  }
  const updated = [entry, ...(Array.isArray(existing) ? existing : [])]
  await fs.writeFile(logPath, JSON.stringify(updated, null, 2), 'utf8')
}

async function runFromCli() {
  const result = await observe()
  console.log(
    [
      'Observer capture complete:',
      `  URL:        ${result.url}`,
      `  Screenshot: ${result.screenshotPath}`,
      `  DOM:        ${result.htmlPath}`,
      result.logPath ? `  Log:        ${result.logPath}` : undefined,
      result.metrics
        ? `  Metrics:    load=${result.metrics.loadTimeMs}ms, nodes=${result.metrics.domNodes}, viscosity=${result.metrics.viscosity}`
        : undefined,
    ]
      .filter(Boolean)
      .join('\n')
  )
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const isMain = typeof require !== 'undefined' && require.main === module
if (isMain) {
  runFromCli().catch((err) => {
    console.error('Observer failed:', err)
    process.exitCode = 1
  })
}
