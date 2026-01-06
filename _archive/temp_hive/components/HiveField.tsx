type BeeNode = {
  id: string
  x: number
  y: number
  size: number
  tone: string
  label: string
  drift?: number
}

'use client'

import { useEffect, useMemo, useState } from 'react'

const nodes: BeeNode[] = [
  { id: 'core', x: 50, y: 50, size: 22, tone: 'from-indigo-400 to-cyan-300', label: 'CODEX' },
  { id: 'mind', x: 22, y: 30, size: 12, tone: 'from-indigo-300 to-purple-300', label: 'Mind', drift: 11 },
  { id: 'memory', x: 74, y: 40, size: 11, tone: 'from-cyan-300 to-indigo-200', label: 'Memory', drift: 10 },
  { id: 'will', x: 65, y: 72, size: 12, tone: 'from-amber-300 to-pink-300', label: 'Will', drift: 12 },
  { id: 'body', x: 30, y: 70, size: 11, tone: 'from-emerald-300 to-amber-200', label: 'Body', drift: 13 },
  { id: 'bee-sentinel', x: 12, y: 46, size: 8, tone: 'from-indigo-300 to-cyan-300', label: 'Sentinel Bee', drift: 9 },
  { id: 'bee-learner', x: 88, y: 26, size: 8, tone: 'from-emerald-300 to-cyan-200', label: 'Learner Bee', drift: 10.5 },
  { id: 'bee-sensor', x: 80, y: 64, size: 9, tone: 'from-indigo-200 to-pink-200', label: 'Sensor Bee', drift: 9.5 },
  { id: 'bee-weaver', x: 46, y: 20, size: 8, tone: 'from-amber-200 to-indigo-200', label: 'Weaver Bee', drift: 11.5 },
  { id: 'bee-chorus', x: 60, y: 18, size: 7, tone: 'from-cyan-200 to-emerald-200', label: 'Chorus Bee', drift: 10 },
  { id: 'bee-navigator', x: 18, y: 58, size: 7, tone: 'from-indigo-200 to-amber-200', label: 'Navigator Bee', drift: 8.5 },
  { id: 'bee-scribe', x: 72, y: 82, size: 7, tone: 'from-emerald-200 to-cyan-300', label: 'Scribe Bee', drift: 9 },
  { id: 'bee-harmonic', x: 54, y: 88, size: 7, tone: 'from-indigo-200 to-emerald-200', label: 'Harmonic Bee', drift: 10.5 },
  { id: 'bee-scout', x: 10, y: 34, size: 6.5, tone: 'from-cyan-300 to-amber-200', label: 'Scout Bee', drift: 9.5 },
]

const links: [string, string][] = [
  ['core', 'mind'],
  ['core', 'memory'],
  ['core', 'will'],
  ['core', 'body'],
  ['mind', 'bee-sentinel'],
  ['memory', 'bee-learner'],
  ['will', 'bee-sensor'],
  ['body', 'bee-weaver'],
  ['bee-sentinel', 'bee-navigator'],
  ['bee-learner', 'bee-chorus'],
  ['bee-sensor', 'bee-scribe'],
  ['bee-weaver', 'bee-chorus'],
  ['bee-chorus', 'bee-harmonic'],
  ['bee-harmonic', 'core'],
  ['bee-scribe', 'memory'],
  ['bee-navigator', 'body'],
  ['bee-scout', 'mind'],
  ['bee-scout', 'core'],
]

export default function HiveField() {
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [chorusPulse, setChorusPulse] = useState(false)
  const [signalNode, setSignalNode] = useState<string | null>(null)
  const linkMap = useMemo(() => {
    const map = new Map<string, string[]>()
    links.forEach(([a, b]) => {
      map.set(a, [...(map.get(a) ?? []), b])
      map.set(b, [...(map.get(b) ?? []), a])
    })
    return map
  }, [])

  useEffect(() => {
    const id = setInterval(() => setChorusPulse((p) => !p), 5200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const candidates = nodes.filter((n) => n.id !== 'core')
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      setSignalNode(pick?.id ?? null)
      if (pick) {
        setTimeout(() => setSignalNode(null), 1100)
      }
    }, 6900)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative h-80 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[rgba(5,9,20,0.8)] to-[rgba(11,18,36,0.8)]">
      <div className="absolute inset-0 opacity-60 blur-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(96,96,255,0.2),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(56,232,255,0.15),transparent_40%)]" />
      </div>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {links.map(([a, b]) => {
          const start = nodes.find((n) => n.id === a)
          const end = nodes.find((n) => n.id === b)
          if (!start || !end) return null
          const pulseHit = chorusPulse && (start.id === 'bee-chorus' || end.id === 'bee-chorus')
          const signalHit = signalNode && (signalNode === start.id || signalNode === end.id)
          const active = (hoverId && (hoverId === start.id || hoverId === end.id)) || pulseHit || signalHit
          return (
            <line
              key={`${a}-${b}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="url(#pulse)"
              strokeWidth={active ? 1.2 : 0.7}
              opacity={active ? 0.9 : 0.55}
              className={`pulse-line ${active ? 'line-active' : ''}`}
            />
          )
        })}
        <defs>
          <linearGradient id="pulse" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(96,96,255,0.8)" />
            <stop offset="100%" stopColor="rgba(56,232,255,0.6)" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
      </svg>
      <div className="relative h-full w-full">
        {nodes.map((node, index) => (
          <div
            key={node.id}
            className="group absolute flex flex-col items-center gap-1"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)',
              animation: `drift ${node.drift ?? 10 + (index % 4) * 2}s ease-in-out infinite alternate`,
              animationDelay: `${index * 0.35}s`,
            }}
            onMouseEnter={() => setHoverId(node.id)}
            onMouseLeave={() => setHoverId(null)}
          >
            <div
              className={`relative flex items-center justify-center rounded-full bg-gradient-to-br ${node.tone} shadow-[0_0_25px_rgba(96,96,255,0.35)] animate-breath transition-transform duration-500 ${
                hoverId === node.id || (hoverId && linkMap.get(hoverId)?.includes(node.id)) ? 'scale-[1.08] node-active' : ''
              } ${(chorusPulse && (node.id === 'bee-chorus' || linkMap.get('bee-chorus')?.includes(node.id))) || signalNode === node.id ? 'node-pulse' : ''}`}
              style={{ width: `${node.size}px`, height: `${node.size}px` }}
            >
              <div className="absolute inset-0 rounded-full blur-lg bg-white/25 opacity-70 animate-halo" />
              <div className="absolute inset-0 rounded-full opacity-60" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)' }} />
              <div className="relative h-full w-full rounded-full border border-white/30 opacity-70" />
            </div>
            {node.label ? (
              <span className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-dim)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {node.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_55%)] mix-blend-screen" />
      <style jsx>{`
        @keyframes drift {
          0% { transform: translate(-50%, -50%) translate3d(0, 0, 0) scale(1); filter: blur(0px); }
          50% { transform: translate(-50%, -50%) translate3d(1.2%, -1.5%, 0) scale(1.02); filter: blur(0.2px); }
          100% { transform: translate(-50%, -50%) translate3d(-1.4%, 1.8%, 0) scale(1); filter: blur(0px); }
        }
        @keyframes dash {
          0% { stroke-dashoffset: 12; }
          100% { stroke-dashoffset: 0; }
        }
        .pulse-line {
          stroke-dasharray: 2 4;
          animation: dash 7s ease-in-out infinite alternate;
        }
        .line-active {
          filter: drop-shadow(0 0 6px rgba(96,96,255,0.5));
        }
        .node-active {
          box-shadow: 0 0 35px rgba(96,96,255,0.45), 0 0 18px rgba(56,232,255,0.35);
        }
        .node-pulse {
          animation: chorus 2.8s ease-in-out infinite;
        }
        @keyframes chorus {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); box-shadow: 0 0 35px rgba(245,193,91,0.45); }
          100% { transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-line, .line-active { animation: none; }
          .node-pulse { animation: none; }
        }
      `}</style>
    </div>
  )
}
