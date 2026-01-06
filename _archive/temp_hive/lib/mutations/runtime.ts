import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import util from 'util'

const execAsync = util.promisify(exec)

export type MutationDef = {
  id: string
  label?: string
  description?: string
  script: string
  args?: string[]
  safe?: boolean
  reversible?: boolean
  tags?: string[]
}

const DEFAULT_INDEX = path.resolve(process.cwd(), 'lib', 'mutations', 'index.json')

export async function loadMutations(indexPath: string = DEFAULT_INDEX): Promise<MutationDef[]> {
  const data = await fs.readFile(indexPath, 'utf8')
  const parsed = JSON.parse(data)
  if (!Array.isArray(parsed)) throw new Error('mutations index must be an array')
  return parsed
}

export async function validateMutations(mutations: MutationDef[]): Promise<MutationDef[]> {
  const seen = new Set<string>()
  for (const m of mutations) {
    if (!m.id) throw new Error('mutation missing id')
    if (seen.has(m.id)) throw new Error(`duplicate mutation id: ${m.id}`)
    seen.add(m.id)
    if (!m.script) throw new Error(`mutation ${m.id} missing script`)
    const full = path.resolve(process.cwd(), m.script)
    try {
      await fs.access(full)
    } catch {
      throw new Error(`mutation script not found: ${m.id} -> ${full}`)
    }
  }
  return mutations
}

export function selectMutations(all: MutationDef[], ids?: string[]): MutationDef[] {
  if (!ids || ids.length === 0) return all
  const wanted = new Set(ids)
  const selected = all.filter((m) => wanted.has(m.id))
  if (!selected.length) throw new Error(`No mutations matched ids: ${ids.join(', ')}`)
  return selected
}

export function listMutations(all: MutationDef[]): string {
  return all
    .map(
      (m) =>
        `- ${m.id} :: ${m.label || ''}${m.safe === false ? '' : ' [safe]'}${
          m.reversible === false ? '' : ' [reversible]'
        } -> ${m.script}${m.description ? `\n    ${m.description}` : ''}`
    )
    .join('\n')
}

export function buildCommand(mutation: MutationDef, revert = false): string {
  const scriptPath = path.resolve(process.cwd(), mutation.script)
  const args = mutation.args ?? []
  const flags = revert ? ['--revert'] : []
  return ['node', scriptPath, ...args, ...flags].join(' ')
}

export async function runCommand(command: string, label?: string) {
  console.log(label ? `[${label}] exec: ${command}` : `exec: ${command}`)
  const { stdout, stderr } = await execAsync(command, { cwd: path.resolve(process.cwd()) })
  if (stdout) console.log(stdout.trim())
  if (stderr) console.error(stderr.trim())
}
