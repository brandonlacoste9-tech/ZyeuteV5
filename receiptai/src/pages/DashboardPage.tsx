import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Camera, TrendingUp, Receipt, DollarSign, Flame, AlertTriangle, ChevronRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { mockFinancialSummary, mockReceipts, mockMonthlySpend } from '@/data/mockData'
import { formatCurrency, formatDate, getRageLevel } from '@/lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useStore()
  const summary = mockFinancialSummary
  const rage = getRageLevel(summary.rageScore)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-gray-400 text-sm mt-1">Your financial truth dashboard</p>
        </div>
        <button onClick={() => navigate('/app/scan')} className="btn-primary flex items-center gap-2">
          <Camera size={18} /> Scan Receipt
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Receipt, label: 'Receipts Saved', value: `${summary.receiptsSaved.toLocaleString()}`, sub: 'not in the trash 🗑️', color: 'text-white' },
          { icon: TrendingUp, label: 'Inflation Overpaid', value: `+$${Math.round(summary.inflationOverpaidYTD).toLocaleString()}`, sub: 'vs your 2022 prices', color: 'text-red-400' },
          { icon: DollarSign, label: 'Deductions Found', value: `$${Math.round(summary.taxDeductionsTracked).toLocaleString()}`, sub: 'in tracked deductions', color: 'text-green-400' },
          { icon: DollarSign, label: 'Estimated Refund', value: `~$${Math.round(summary.estimatedRefund).toLocaleString()}`, sub: 'coming back to you 💰', color: 'text-green-400' },
        ].map(({ icon: Icon, label, value, sub, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card">
            <div className="flex items-center gap-2 text-gray-400">
              <Icon size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <div className={`font-display font-bold text-3xl ${color}`}>{value}</div>
            <p className="text-xs text-gray-400">{sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="font-display font-semibold text-white mb-4">Monthly Spend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={mockMonthlySpend}>
              <XAxis dataKey="label" stroke="#ffffff20" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <YAxis stroke="#ffffff20" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1A1E32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Line type="monotone" dataKey="amount" stroke="#00FF85" strokeWidth={2} dot={{ fill: '#00FF85', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-white mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={summary.categoryBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="amount">
                {summary.categoryBreakdown.map((entry) => (
                  <Cell key={entry.category} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {summary.categoryBreakdown.slice(0, 4).map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-400">{cat.category}</span>
                </div>
                <span className="text-white font-medium">${cat.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={18} className="text-orange-400" />
            <h3 className="font-display font-semibold text-white">Rage Score</h3>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #00FF85, #FFD700, #FF3B30)' }}
              initial={{ width: 0 }}
              animate={{ width: `${summary.rageScore}%` }}
              transition={{ duration: 1.2 }}
            />
          </div>
          <p className="text-sm">
            <span className="text-2xl">{rage.emoji}</span>{' '}
            <span style={{ color: rage.color }} className="font-bold">{rage.label}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Top gouged: {summary.topGougedItem}</p>
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-white">Recent Receipts</h3>
            <button onClick={() => navigate('/app/wallet')} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
              See All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {mockReceipts.slice(0, 4).map((receipt) => (
              <div key={receipt.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                  {receipt.storeCategory === 'grocery' ? '🛒' : receipt.storeCategory === 'gas' ? '⛽' : receipt.storeCategory === 'pharmacy' ? '💊' : receipt.storeCategory === 'dining' ? '🍽️' : receipt.storeCategory === 'office_supply' ? '📎' : '🧾'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{receipt.storeName}</p>
                  <p className="text-xs text-gray-400">{formatDate(receipt.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{formatCurrency(receipt.totalPaid)}</p>
                  {receipt.isDeductible && <span className="deductible-badge">deductible</span>}
                </div>
                {receipt.overpaid > 5 && <AlertTriangle size={14} className="text-red-400 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-4 border border-green-400/10">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🦫</div>
          <div>
            <p className="text-sm font-medium text-white">Ti-Guy says:</p>
            <p className="text-sm text-gray-300">
              "Garde ben tes factures, mon ami! You've found{' '}
              <span className="text-green-400 font-bold">${Math.round(summary.estimatedRefund).toLocaleString()}</span>{' '}
              in potential refunds. Keep scanning! 🐝"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
