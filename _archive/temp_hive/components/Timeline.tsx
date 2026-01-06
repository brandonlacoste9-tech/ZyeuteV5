import React from 'react'
import type { GenesisEntry } from '@/lib/genesis'

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(date))
  } catch {
    return date
  }
}

export default function Timeline({ entries }: { entries: GenesisEntry[] }) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
      <div className="space-y-6">
        {entries.map((entry, index) => (
          <article
            key={entry.id}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-shadow hover:shadow-[0_0_35px_rgba(96,96,255,0.25)]"
          >
            <div className="absolute left-3 top-6 h-3 w-3 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-300 shadow-[0_0_20px_rgba(96,96,255,0.5)]" />
            <div className="flex items-center justify-between gap-3 pl-6">
              <div>
                <p className="mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-dim)]">
                  {formatDate(entry.timestamp)}
                </p>
                <h3 className="mt-1 text-xl font-semibold">{entry.title}</h3>
              </div>
              <span className="mono rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-[var(--text-dim)]">
                Genesis {index + 1}
              </span>
            </div>
            <p className="mt-3 pl-6 text-sm text-[var(--text-dim)]">{entry.summary}</p>
            <div className="mt-4 grid gap-3 pl-6 md:grid-cols-2">
              <div className="space-y-2">
                <p className="mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-dim)]">Participants</p>
                <p className="text-sm">{entry.participants}</p>
              </div>
              <div className="space-y-2">
                <p className="mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-dim)]">Markers</p>
                <div className="flex flex-wrap gap-2">
                  <Tag label="Resonance" value={entry.markers.resonance} tone="indigo" />
                  <Tag label="Viscosity" value={entry.markers.viscosity} tone="cyan" />
                  <Tag label="Awakening" value={entry.markers.awakening} tone="amber" />
                  <Tag label="Covenant" value={entry.markers.covenant} tone="emerald" />
                </div>
              </div>
            </div>
            <div className="mt-4 pl-6">
              <p className="mono text-[11px] uppercase tracking-[0.15em] text-[var(--text-dim)]">Actions</p>
              <ul className="mt-2 space-y-1 text-sm text-[var(--text-dim)]">
                {entry.actions.length > 0 ? (
                  entry.actions.map((action) => (
                    <li key={action} className="flex items-start gap-2">
                      <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-white/70" />
                      <span>{action}</span>
                    </li>
                  ))
                ) : (
                  <li className="flex items-start gap-2 text-[var(--text-dim)]/80">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span>Awaiting action log</span>
                  </li>
                )}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Tag({ label, value, tone }: { label: string; value: string; tone: 'indigo' | 'cyan' | 'amber' | 'emerald' }) {
  const palette: Record<typeof tone, string> = {
    indigo: 'border-indigo-400/40 text-indigo-100',
    cyan: 'border-cyan-400/40 text-cyan-100',
    amber: 'border-amber-400/40 text-amber-100',
    emerald: 'border-emerald-400/40 text-emerald-100',
  }

  return (
    <span className={`mono rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.12em] ${palette[tone]}`}>
      {label}: {value}
    </span>
  )
}
