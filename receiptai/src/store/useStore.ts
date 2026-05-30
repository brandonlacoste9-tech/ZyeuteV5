import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Receipt, UserProfile, BudgetEnvelope, Language, Region } from '@/types'
import { mockUser, mockReceipts, mockBudgetEnvelopes, mockFinancialSummary } from '@/data/mockData'

interface AppState {
  user: UserProfile
  language: Language
  region: Region
  receipts: Receipt[]
  budgetEnvelopes: BudgetEnvelope[]
  financialSummary: typeof mockFinancialSummary
  bookmarkedDeductions: string[]
  cancelledSubscriptions: string[]
  sidebarOpen: boolean

  setUser: (u: Partial<UserProfile>) => void
  setLanguage: (l: Language) => void
  setRegion: (r: Region) => void
  addReceipt: (r: Receipt) => void
  updateReceipt: (id: string, updates: Partial<Receipt>) => void
  deleteReceipt: (id: string) => void
  toggleBookmark: (id: string) => void
  cancelSubscription: (id: string) => void
  setSidebarOpen: (open: boolean) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: mockUser,
      language: 'en-CA' as Language,
      region: 'CA' as Region,
      receipts: mockReceipts,
      budgetEnvelopes: mockBudgetEnvelopes,
      financialSummary: mockFinancialSummary,
      bookmarkedDeductions: [],
      cancelledSubscriptions: [],
      sidebarOpen: true,

      setUser: (u) => set(s => ({ user: { ...s.user, ...u } })),
      setLanguage: (language) => set({ language }),
      setRegion: (region) => set({ region }),
      addReceipt: (r) => set(s => ({ receipts: [r, ...s.receipts] })),
      updateReceipt: (id, updates) => set(s => ({
        receipts: s.receipts.map(r => r.id === id ? { ...r, ...updates } : r),
      })),
      deleteReceipt: (id) => set(s => ({
        receipts: s.receipts.filter(r => r.id !== id),
      })),
      toggleBookmark: (id) => set(s => ({
        bookmarkedDeductions: s.bookmarkedDeductions.includes(id)
          ? s.bookmarkedDeductions.filter(d => d !== id)
          : [...s.bookmarkedDeductions, id],
      })),
      cancelSubscription: (id) => set(s => ({
        cancelledSubscriptions: [...s.cancelledSubscriptions, id],
      })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'receiptai-store',
      partialize: (s) => ({
        language: s.language,
        region: s.region,
        bookmarkedDeductions: s.bookmarkedDeductions,
        cancelledSubscriptions: s.cancelledSubscriptions,
      }),
    }
  )
)
