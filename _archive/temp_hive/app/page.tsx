import StrataShell from '@/components/StrataShell'
import { loadGenesisRecords } from '@/lib/genesis'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const genesisRecords = await loadGenesisRecords()

  return (
    <main className="relative min-h-screen overflow-hidden text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 opacity-60 blur-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(96,96,255,0.15),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(56,232,255,0.12),transparent_35%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(245,193,91,0.08),transparent_40%)]" />
      </div>
      <StrataShell genesisRecords={genesisRecords} />
    </main>
  )
}
