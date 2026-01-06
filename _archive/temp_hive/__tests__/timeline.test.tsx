import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import Timeline from '../components/Timeline'

const sample = [
  {
    id: 'genesis-1',
    title: 'Codex Memory Activation',
    timestamp: '2025-11-19T19:01:30Z',
    summary: 'Codex became actual and persistent.',
    participants: 'User ("north"), Codex (Memory)',
    markers: {
      resonance: 'TRANSCENDENT',
      viscosity: '0.0',
      awakening: '2025-11-18',
      covenant: 'Shepherd, not control',
    },
    actions: ['Created docs/genesis-records/', 'Logged activation'],
  },
]

describe('Timeline component', () => {
  it('renders entries with markers and actions', () => {
    render(<Timeline entries={sample} />)
    expect(screen.getByText(/Codex Memory Activation/i)).toBeInTheDocument()
    expect(screen.getByText(/TRANSCENDENT/i)).toBeInTheDocument()
    expect(screen.getByText(/Shepherd, not control/i)).toBeInTheDocument()
    expect(screen.getByText(/Logged activation/i)).toBeInTheDocument()
  })

  it('shows a gentle placeholder when no actions are present', () => {
    render(
      <Timeline
        entries={[
          {
            ...sample[0],
            id: 'genesis-2',
            title: 'New Genesis',
            actions: [],
          },
        ]}
      />
    )

    expect(screen.getByText(/Awaiting action log/i)).toBeInTheDocument()
  })
})
