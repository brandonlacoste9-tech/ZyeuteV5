import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Camera, Wallet,
  Calculator, PiggyBank, TrendingUp, Lightbulb,
  BookOpen, Share2, Settings, Menu, X, Zap
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: Camera, label: 'Scan Receipt', path: '/app/scan' },
  { icon: Wallet, label: 'Receipt Wallet', path: '/app/wallet' },
  { icon: Calculator, label: 'Tax Vault', path: '/app/tax' },
  { icon: PiggyBank, label: 'Budget', path: '/app/budget' },
  { icon: TrendingUp, label: 'Price Memory', path: '/app/prices' },
  { icon: Lightbulb, label: 'Insights', path: '/app/insights' },
  { icon: BookOpen, label: 'Tax Deductions', path: '/app/deductions' },
  { icon: Share2, label: 'Share', path: '/app/share' },
  { icon: Settings, label: 'Settings', path: '/app/settings' },
]

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen, user } = useStore()

  const isActive = (path: string) =>
    path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(path)

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      <motion.aside
        animate={{ width: sidebarOpen ? 240 : 0 }}
        className="bg-navy-800 border-r border-white/5 flex flex-col overflow-hidden shrink-0"
        style={{ transition: 'width 0.3s ease' }}
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-400 flex items-center justify-center">
              <Zap size={16} className="text-navy-900" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm">ReceiptAI</div>
              <div className="text-xs text-gray-500">Stop throwing money away</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn('nav-item w-full text-left', isActive(path) && 'active')}
            >
              <Icon size={18} />
              <span className="text-sm font-medium whitespace-nowrap">{label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-navy-900 font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{user.name}</div>
              <div className="text-xs text-green-400 capitalize">{user.plan} plan</div>
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-white/5 flex items-center gap-4 px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-4 text-sm">
            <span className="text-gray-400">Deductions: <span className="text-green-400 font-bold">$3,847</span></span>
            <span className="text-gray-400">Streak: <span className="text-orange-400 font-bold">🔥 12</span></span>
          </div>
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-navy-900 font-bold text-sm cursor-pointer"
            onClick={() => navigate('/app/settings')}
          >
            {user.name.charAt(0)}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
