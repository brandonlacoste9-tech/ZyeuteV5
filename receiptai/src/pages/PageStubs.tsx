import { Construction } from 'lucide-react'

function PageStub({ title, emoji, description, cursorPrompt }: { title: string; emoji: string; description: string; cursorPrompt: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">{emoji} {title}</h1>
        <p className="text-gray-400 text-sm mt-1">{description}</p>
      </div>
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="text-6xl mb-4">{emoji}</div>
        <h2 className="font-display font-bold text-xl text-white mb-2">{title}</h2>
        <p className="text-gray-400 max-w-md mb-6">{description}</p>
        <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 px-4 py-2 rounded-xl border border-yellow-400/20 mb-4">
          <Construction size={16} /><span>Open in Cursor → ask Claude to build this</span>
        </div>
        <div className="bg-navy-700 rounded-xl p-4 text-left max-w-sm text-xs border border-white/5">
          <p className="font-mono text-green-400 mb-1">Cursor prompt:</p>
          <p className="font-mono text-gray-300">"{cursorPrompt}"</p>
        </div>
      </div>
    </div>
  )
}

export const WalletPage = () => <PageStub title="Receipt Wallet" emoji="🧾" description="All your receipts, forever. Filter by category, date, or deductible status." cursorPrompt="Build WalletPage using Receipt type and mockReceipts. Include filter bar, receipt cards grid with category tags, bulk select, and stats bar at bottom." />

export const TaxPage = () => <PageStub title="Tax Vault" emoji="🧮" description="Track deductions, estimate your refund, export to PDF." cursorPrompt="Build TaxPage using mockTaxSummary. Show total deductions hero card, category breakdown with refund estimates, Quebec GST/QST section, filtered receipt list, and PDF export button." />

export const BudgetPage = () => <PageStub title="Budget Envelopes" emoji="💰" description="6 envelopes with real-time tracking. Know before you overspend." cursorPrompt="Build BudgetPage using mockBudgetEnvelopes. Show 6 envelope cards with animated progress bars (green/yellow/red), month summary card, and AI warning toasts at >80%." />

export const PricesPage = () => <PageStub title="Price Memory" emoji="📊" description="Your personal price database. Always know when you're getting the best deal." cursorPrompt="Build PricesPage using mockPriceHistory. Show product cards with sparkline charts, best price badge, last price vs best price comparison, and Hall of Shame section." />

export const InsightsPage = () => <PageStub title="Insights" emoji="💡" description="AI money story, subscription graveyard, price gouging leaderboard." cursorPrompt="Build InsightsPage using mockSubscriptions and mockFinancialSummary. Show AI narrative card, subscription graveyard with cancel buttons, and price gouging leaderboard top 5." />

export const DeductionsPage = () => <PageStub title="Tax Deductions Bible" emoji="🌎" description="Every deduction for Canada, USA, Mexico, Brazil, Argentina." cursorPrompt="Build DeductionsPage using taxDeductionsDB from data/taxDeductions.ts. Show region tabs (CA/US/MX/BR/AR), category filter pills, searchable deduction cards with difficulty badge and bookmark button." />

export const SharePage = () => <PageStub title="Share Your Stats" emoji="🔥" description="Generate viral Rage Cards and Tax Win Cards. Make your friends feel the pain." cursorPrompt="Build SharePage with two card generators: Rage Card (inflation stats in red) and Tax Win Card (deductions found in gold). Use html2canvas for PNG download. Add confetti on share click." />

export const SettingsPage = () => <PageStub title="Settings" emoji="⚙️" description="Set your region, language, tax bracket, and preferences." cursorPrompt="Build SettingsPage with profile section, region selector (5 countries), language toggle (6 languages), employment type selector, vehicle business use % slider, and home office % slider." />
