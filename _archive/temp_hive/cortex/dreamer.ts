import { observe } from './observer'
import {
  buildCommand,
  listMutations,
  loadMutations,
  runCommand,
  selectMutations,
  validateMutations,
  MutationDef,
} from '../lib/mutations/runtime'
import { writeGenesisDraft } from '../lib/genesisDraft'

type DreamConfig = {
  mutationCommand?: string
  mutationId?: string
  mutationList?: string[]
  runAll?: boolean
  listOnly?: boolean
  baselineTag: string
  mutationTag: string
  readySelector?: string
  waitAfterLoadMs?: number
  genesisDraft?: boolean
  genesisParticipants?: string
  genesisIntent?: string
}

const DEFAULTS: DreamConfig = {
  mutationCommand: process.env.DREAM_MUTATION_COMMAND,
  mutationId: process.env.DREAM_MUTATION_ID,
  mutationList: process.env.DREAM_MUTATION_LIST
    ? process.env.DREAM_MUTATION_LIST.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined,
  runAll:
    process.env.DREAM_MUTATION_BATCH === 'true' ||
    process.env.DREAM_RUN_ALL === 'true' ||
    process.env.DREAM_RUN_BATCH === 'true',
  listOnly:
    process.env.DREAM_LIST === 'true' ||
    process.env.DREAM_LIST_ONLY === 'true' ||
    process.env.DREAM_MUTATION_LIST_ONLY === 'true',
  baselineTag: process.env.DREAM_BASELINE_TAG || 'baseline',
  mutationTag: process.env.DREAM_MUTATION_TAG || 'mutation',
  readySelector: process.env.OBSERVER_READY_SELECTOR,
  waitAfterLoadMs: process.env.OBSERVER_WAIT_AFTER_LOAD_MS
    ? parseInt(process.env.OBSERVER_WAIT_AFTER_LOAD_MS, 10)
    : undefined,
  genesisDraft: process.env.DREAM_GENESIS_DRAFT === 'true',
  genesisParticipants: process.env.DREAM_GENESIS_PARTICIPANTS,
  genesisIntent: process.env.DREAM_GENESIS_INTENT,
}

async function runSingleMutation(mutation: MutationDef, config: DreamConfig) {
  const baselineTag = `${config.baselineTag}-${mutation.id}`
  const mutationTag = `${config.mutationTag}-${mutation.id}`

  console.log(`🟦 [Dreamer] Capturing baseline for ${mutation.id}...`)
  const baseline = await observe({
    tag: baselineTag,
    readySelector: config.readySelector,
    waitAfterLoadMs: config.waitAfterLoadMs ?? 1500,
  })

  console.log(`🟨 [Dreamer] Applying mutation ${mutation.id}...`)
  await runCommand(buildCommand(mutation, false), mutation.id)

  console.log(`🟥 [Dreamer] Capturing post-mutation for ${mutation.id}...`)
  const mutated = await observe({
    tag: mutationTag,
    readySelector: config.readySelector,
    waitAfterLoadMs: config.waitAfterLoadMs ?? 1500,
  })

  console.log(`🧹 [Dreamer] Reverting mutation ${mutation.id}...`)
  await runCommand(buildCommand(mutation, true), `${mutation.id}-revert`)

  if (config.genesisDraft) {
    await writeGenesisDraft({
      mutationId: mutation.id,
      tag: mutationTag,
      metrics: mutated.metrics,
      participants: config.genesisParticipants,
      intent: config.genesisIntent,
    })
    console.log(`📜 [Dreamer] Draft genesis record created for ${mutation.id}`)
  }

  console.log(
    [
      `✅ [Dreamer] cycle complete for ${mutation.id}`,
      `  Baseline: ${baseline.screenshotPath}`,
      `  Mutated:  ${mutated.screenshotPath}`,
      `  Log:      ${mutated.logPath || 'lib/cortex-logs.json (default)'}`,
    ].join('\n')
  )
}

async function runBatch(mutations: MutationDef[], config: DreamConfig) {
  for (const mutation of mutations) {
    await runSingleMutation(mutation, config)
  }
}

async function runCustomCommand(command: string, config: DreamConfig) {
  console.log('🟦 [Dreamer] Capturing baseline...')
  const baseline = await observe({
    tag: config.baselineTag,
    readySelector: config.readySelector,
    waitAfterLoadMs: config.waitAfterLoadMs ?? 1500,
  })

  console.log(`🟨 [Dreamer] Running custom mutation command: "${command}"`)
  await runCommand(command, 'custom')

  console.log('🟥 [Dreamer] Capturing post-mutation...')
  const mutated = await observe({
    tag: config.mutationTag,
    readySelector: config.readySelector,
    waitAfterLoadMs: config.waitAfterLoadMs ?? 1500,
  })

  if (config.genesisDraft) {
    await writeGenesisDraft({
      mutationId: 'custom-command',
      tag: config.mutationTag,
      metrics: mutated.metrics,
      participants: config.genesisParticipants,
      intent: config.genesisIntent,
    })
    console.log(`📜 [Dreamer] Draft genesis record created for custom command`)
  }

  console.log(
    [
      '✅ Dream cycle complete (custom command)',
      `  Baseline screenshot: ${baseline.screenshotPath}`,
      `  Mutated screenshot:  ${mutated.screenshotPath}`,
      `  Log file:            ${mutated.logPath || 'lib/cortex-logs.json (default)'}`,
    ].join('\n')
  )
}

async function dream(cfg: Partial<DreamConfig> = {}) {
  const config: DreamConfig = { ...DEFAULTS, ...cfg }

  const mutations = await validateMutations(await loadMutations())

  if (config.listOnly) {
    console.log('Available mutations:\n' + listMutations(mutations))
    return
  }

  if (config.runAll || (config.mutationList && config.mutationList.length > 1)) {
    const selected = config.runAll ? mutations : selectMutations(mutations, config.mutationList)
    await runBatch(selected, config)
    return
  }

  if (config.mutationId) {
    const mutation = selectMutations(mutations, [config.mutationId])[0]
    await runSingleMutation(mutation, config)
    return
  }

  if (config.mutationCommand) {
    await runCustomCommand(config.mutationCommand, config)
    return
  }

  throw new Error(
    'No mutation selected. Set DREAM_MUTATION_ID (from index.json), DREAM_MUTATION_LIST comma-separated, DREAM_RUN_ALL=true to run all, DREAM_LIST_ONLY=true to list, or DREAM_MUTATION_COMMAND for a custom command.'
  )
}

if (require.main === module) {
  dream().catch((err) => {
    console.error('Dreamer failed:', err)
    process.exitCode = 1
  })
}
