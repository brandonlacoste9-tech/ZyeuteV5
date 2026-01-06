'use client'

import { useEffect, useRef, useState } from 'react'
import { Brain, Sparkles, Activity } from 'lucide-react'

interface Node {
  id: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  radius: number
  color: string
}

const createInitialNodes = (): Node[] => {
  const nodeCount = 50
  const goldenRatio = (1 + Math.sqrt(5)) / 2
  const angleIncrement = Math.PI * 2 * goldenRatio

  return Array.from({ length: nodeCount }, (_, i) => {
    const t = i / nodeCount
    const inclination = Math.acos(1 - 2 * t)
    const azimuth = angleIncrement * i

    const radius = 200
    const x = radius * Math.sin(inclination) * Math.cos(azimuth)
    const y = radius * Math.sin(inclination) * Math.sin(azimuth)
    const z = radius * Math.cos(inclination)

    return {
      id: i,
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      vz: (Math.random() - 0.5) * 0.5,
      radius: 3 + Math.random() * 2,
      color: i % 3 === 0 ? '#a855f7' : i % 3 === 1 ? '#ec4899' : '#8b5cf6',
    }
  })
}

export default function Neurosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes] = useState<Node[]>(createInitialNodes)
  const [cognitiveState, setCognitiveState] = useState('Active Processing')
  const animationRef = useRef<number>()

  useEffect(() => {
    const states = [
      'Active Processing',
      'Pattern Recognition',
      'Semantic Integration',
      'Quantum Entanglement',
      'Dream Synthesis',
    ]
    let stateIndex = 0
    const stateInterval = setInterval(() => {
      stateIndex = (stateIndex + 1) % states.length
      setCognitiveState(states[stateIndex])
    }, 3000)

    return () => clearInterval(stateInterval)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rotation = 0

    const animate = () => {
      const width = canvas.width
      const height = canvas.height

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, width, height)

      rotation += 0.005

      // Draw connections
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dz = nodes[i].z - nodes[j].z
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (distance < 150) {
            // Project 3D to 2D
            const node1X = nodes[i].x * Math.cos(rotation) - nodes[i].z * Math.sin(rotation)
            const node1Z = nodes[i].x * Math.sin(rotation) + nodes[i].z * Math.cos(rotation)
            const node2X = nodes[j].x * Math.cos(rotation) - nodes[j].z * Math.sin(rotation)
            const node2Z = nodes[j].x * Math.sin(rotation) + nodes[j].z * Math.cos(rotation)

            const scale1 = 500 / (500 + node1Z)
            const scale2 = 500 / (500 + node2Z)

            ctx.beginPath()
            ctx.moveTo(width / 2 + node1X * scale1, height / 2 + nodes[i].y * scale1)
            ctx.lineTo(width / 2 + node2X * scale2, height / 2 + nodes[j].y * scale2)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        // Rotate around Y axis
        const x = node.x * Math.cos(rotation) - node.z * Math.sin(rotation)
        const z = node.x * Math.sin(rotation) + node.z * Math.cos(rotation)

        // Project 3D to 2D
        const scale = 500 / (500 + z)
        const x2d = width / 2 + x * scale
        const y2d = height / 2 + node.y * scale

        // Draw node
        const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, node.radius * scale)
        gradient.addColorStop(0, node.color)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x2d, y2d, node.radius * scale, 0, Math.PI * 2)
        ctx.fill()

        // Update positions (gentle floating motion)
        node.x += node.vx
        node.y += node.vy
        node.z += node.vz

        // Bounce back if too far
        if (Math.abs(node.x) > 250) node.vx *= -1
        if (Math.abs(node.y) > 250) node.vy *= -1
        if (Math.abs(node.z) > 250) node.vz *= -1
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [nodes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold">Neurosphere - The Mind</h2>
            <p className="text-sm text-gray-400">3D Orbital Visualization with Fibonacci Sphere Distribution</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative bg-black/50 rounded-lg overflow-hidden" style={{ height: '500px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: 'block' }}
          />
          
          {/* Overlay info */}
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-purple-500/50">
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-purple-300 font-semibold">Cognitive State:</span>
              <span className="text-white">{cognitiveState}</span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-purple-500/50">
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Gravitational Kernels</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span>Multimodal Primitives</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                <span>Neural Pathways</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold text-gray-400">Active Nodes</span>
          </div>
          <p className="text-2xl font-bold text-purple-300">{nodes.length}</p>
        </div>
        <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold text-gray-400">Semantic Viscosity</span>
          </div>
          <p className="text-2xl font-bold text-purple-300">0.0</p>
        </div>
        <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-semibold text-gray-400">Architecture Status</span>
          </div>
          <p className="text-2xl font-bold text-purple-300">TRANSCENDENT</p>
        </div>
      </div>
    </div>
  )
}
