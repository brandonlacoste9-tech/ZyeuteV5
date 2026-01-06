import fs from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  const indexPath = path.join(process.cwd(), 'lib', 'mutations', 'index.json')
  try {
    const text = await fs.readFile(indexPath, 'utf8')
    const entries = JSON.parse(text)
    if (!Array.isArray(entries)) throw new Error('Mutations index is not an array')
    return NextResponse.json(entries, { status: 200 })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
