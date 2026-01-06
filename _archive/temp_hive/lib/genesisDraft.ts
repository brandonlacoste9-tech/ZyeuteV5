import fs from 'fs/promises'
import path from 'path'
import { ObservationMetrics } from '../cortex/observer'

type GenesisDraftInput = {
  mutationId: string
  tag?: string
  metrics?: ObservationMetrics
  participants?: string
  intent?: string
}

const draftsDir = path.resolve(process.cwd(), 'docs', 'genesis-records', 'drafts')

function nowIso() {
  return new Date().toISOString()
}

function buildFileName(mutationId: string) {
  const stamp = nowIso().replace(/[:.]/g, '-')
  const safeId = mutationId.replace(/[^a-zA-Z0-9-_]/g, '') || 'mutation'
  return `draft-${stamp}-${safeId}.md`
}

function renderMetrics(metrics?: ObservationMetrics) {
  if (!metrics) return '_metrics unavailable_'
  const lines = [
    `- loadTimeMs: ${metrics.loadTimeMs ?? 'n/a'}`,
    `- domCompleteMs: ${metrics.domCompleteMs ?? 'n/a'}`,
    `- domInteractiveMs: ${metrics.domInteractiveMs ?? 'n/a'}`,
    `- fcpMs: ${metrics.fcpMs ?? 'n/a'}`,
    `- domNodes: ${metrics.domNodes ?? 'n/a'}`,
    `- layoutShift: ${metrics.layoutShift ?? 'n/a'}`,
    `- viscosity: ${metrics.viscosity ?? 'n/a'}`,
    `- resonance: ${metrics.resonance ?? 'n/a'}`,
  ]
  return lines.join('\n')
}

export async function writeGenesisDraft(input: GenesisDraftInput) {
  const fileName = buildFileName(input.mutationId)
  await fs.mkdir(draftsDir, { recursive: true })

  const timestamp = nowIso()
  const lines = [
    `# Draft Genesis Record for mutation: ${input.mutationId}`,
    '',
    `- timestamp: ${timestamp}`,
    `- tag: ${input.tag ?? 'mutation'}`,
    `- participants: ${input.participants ?? 'N/A'}`,
    `- intent: ${input.intent ?? 'unspecified'}`,
    '',
    '## Metrics',
    renderMetrics(input.metrics),
    '',
    '## Actions',
    '- draft created via Dreamer capture',
  ]

  const fullPath = path.join(draftsDir, fileName)
  await fs.writeFile(fullPath, lines.join('\n'), 'utf8')
  return fullPath
}
