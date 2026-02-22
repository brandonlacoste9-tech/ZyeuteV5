export type Region = 'CA' | 'US' | 'MX' | 'BR' | 'AR'
export type Language = 'en-CA' | 'fr-CA' | 'en-US' | 'es-MX' | 'pt-BR' | 'es-AR'
export type Currency = 'CAD' | 'USD' | 'MXN' | 'BRL' | 'ARS'

export type TaxCategory =
  | 'medical' | 'business' | 'vehicle' | 'home_office'
  | 'technology' | 'education' | 'charity' | 'investment'
  | 'childcare' | 'other' | 'non_deductible'

export type ReceiptCategory =
  | 'grocery' | 'dining' | 'gas' | 'pharmacy' | 'electronics'
  | 'clothing' | 'subscription' | 'medical' | 'office_supply'
  | 'travel' | 'entertainment' | 'other'

export interface ReceiptLineItem {
  id: string
  name: string
  qty: number
  unitPrice: number
  price2022: number
  changePercent: number
  isGouged: boolean
  taxCategory: TaxCategory | null
  isDeductible: boolean
}

export interface Receipt {
  id: string
  storeName: string
  storeCategory: ReceiptCategory
  date: string
  totalPaid: number
  total2022Equivalent: number
  overpaid: number
  items: ReceiptLineItem[]
  deductibleAmount: number
  taxCategory: TaxCategory | null
  isDeductible: boolean
  gst?: number
  qst?: number
  region: Region
}

export interface BarcodeProduct {
  id: string
  barcode: string
  name: string
  brand: string
  category: ReceiptCategory
  currentPrice: number
  price2022: number
  changePercent: number
  storePrices: StorePrice[]
  nutritionGrade: 'A' | 'B' | 'C' | 'D' | 'N/A'
}

export interface StorePrice {
  store: string
  price: number
  isCheapest: boolean
}

export interface BudgetEnvelope {
  id: string
  category: string
  label: string
  icon: string
  budgetAmount: number
  spentAmount: number
  color: string
}

export interface Subscription {
  id: string
  name: string
  monthlyCost: number
  lastUsed: string
  category: string
  icon: string
  isActive: boolean
  daysSinceUsed: number
}

export interface TaxSummary {
  region: Region
  totalDeductions: number
  estimatedRefund: number
  gstPaid: number
  qstPaid: number
  itcEligible: number
  byCategory: TaxCategorySummary[]
  deadlineDate: string
  taxRate: number
}

export interface TaxCategorySummary {
  category: TaxCategory
  label: string
  icon: string
  amount: number
  estimatedRefund: number
  receiptCount: number
  color: string
}

export interface TaxDeduction {
  id: string
  region: Region
  category: TaxCategory
  name: Record<Language, string>
  description: Record<Language, string>
  whoQualifies: Record<Language, string>
  percentageBack: number
  difficulty: 'easy' | 'medium' | 'complex'
  receiptTip: Record<Language, string>
  requiredDocumentation: Record<Language, string>
  taxAuthority: string
  formRequired?: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  plan: 'free' | 'pro' | 'tax_vault'
  region: Region
  language: Language
  currency: Currency
  memberSince: string
  scanStreak: number
  totalReceiptsScanned: number
  employmentType: 'employee' | 'self_employed' | 'both'
  estimatedTaxBracket: number
  vehicleBusinessUsePercent: number
  homeOfficePercent: number
}

export interface MonthlySpend {
  month: string
  amount: number
  label: string
}

export interface ScanTip {
  id: string
  storeCategory: ReceiptCategory
  region: Region
  headline: Record<Language, string>
  explanation: Record<Language, string>
  taxCategory?: TaxCategory
  actionLabel: Record<Language, string>
}
