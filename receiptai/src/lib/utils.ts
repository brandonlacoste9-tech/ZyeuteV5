import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Region, Currency } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: Currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(date))
}

export function getBudgetPercent(spent: number, budget: number): number {
  return Math.min((spent / budget) * 100, 100)
}

export function getBudgetStatus(percent: number): 'healthy' | 'warning' | 'danger' {
  if (percent >= 90) return 'danger'
  if (percent >= 75) return 'warning'
  return 'healthy'
}

export function getRageLevel(score: number) {
  if (score >= 80) return { label: 'Maximum Rage', color: '#FF3B30', emoji: '🤬' }
  if (score >= 60) return { label: 'Very Angry', color: '#FF6B2B', emoji: '😡' }
  if (score >= 40) return { label: 'Annoyed', color: '#FF9500', emoji: '😤' }
  return { label: 'Mildly Upset', color: '#FFD700', emoji: '😒' }
}

export function getTaxRateByRegion(region: Region): number {
  const rates: Record<Region, number> = {
    CA: 0.265, US: 0.22, MX: 0.30, BR: 0.275, AR: 0.35,
  }
  return rates[region] ?? 0.265
}

export function triggerConfetti(): void {
  const colors = ['#00FF85', '#FFD700', '#FF3B30', '#ffffff']
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div')
    piece.className = 'confetti-piece'
    piece.style.left = `${Math.random() * 100}vw`
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    piece.style.width = piece.style.height = `${Math.random() * 12 + 6}px`
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0'
    piece.style.animationDelay = `${Math.random() * 2}s`
    piece.style.animationDuration = `${Math.random() * 2 + 2}s`
    document.body.appendChild(piece)
    setTimeout(() => piece.remove(), 4000)
  }
}

export function simulateScan(delay = 450): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delay))
}

export function generateReceiptId(): string {
  return `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
