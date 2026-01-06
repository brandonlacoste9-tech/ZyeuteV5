import fs from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  const logPath = path.join(process.cwd(), 'lib', 'cortex-logs.json')
  try {
    const text = await fs.readFile(logPath, 'utf8')
    const entries = JSON.parse(text)
    if (!Array.isArray(entries)) throw new Error('Log content is not an array')
    entries.sort((a, b) => Date.parse(b.timestamp || '') - Date.parse(a.timestamp || ''))
    return NextResponse.json(entries, { status: 200 })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
