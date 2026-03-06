import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Receipt, Calculator, Flame, Check, Zap, Globe } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-navy-900">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-400 flex items-center justify-center">
            <Zap size={16} className="text-navy-900" />
          </div>
          <span className="font-display font-bold text-white">ReceiptAI</span>
        </div>
        <button onClick={() => navigate('/app')} className="btn-primary text-sm py-2 px-4">Start Free</button>
      </nav>

      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 rounded-full">
            <Flame size={14} />
            Tax season is here. Start scanning before you lose your deductions forever.
          </div>
          <h1 className="font-display font-black text-5xl md:text-7xl text-white leading-tight">
            Stop Throwing<br /><span className="text-gradient">Money In The Trash.</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Every receipt you toss is a tax deduction you'll never see.{' '}
            <strong className="text-white">Snap it. Store it. Get paid back.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/app')} className="btn-primary text-lg py-4 px-8">Scan Your First Receipt Free</button>
            <button onClick={() => navigate('/app')} className="btn-secondary text-lg py-4 px-8">See How It Works</button>
          </div>
          <p className="text-gray-500 text-sm">🔥 127,483 receipts saved from the trash today</p>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Camera, title: 'Snap Any Receipt', desc: 'Photo or barcode scan. AI extracts every line item instantly.', color: '#00FF85' },
            { icon: Receipt, title: 'Receipt Wallet', desc: 'Every receipt stored forever. Never lose a deduction again.', color: '#00B4D8' },
            { icon: Calculator, title: 'Tax Vault', desc: 'Auto-tags deductible expenses. Estimates your refund in real-time.', color: '#FFD700' },
            { icon: Globe, title: '5 Countries', desc: 'Canada, USA, Mexico, Brazil, Argentina. In your language.', color: '#EF476F' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <h3 className="font-display font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="font-display font-bold text-3xl text-white text-center mb-10">Start Free. Pay if it pays you back.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { plan: 'Free', price: '$0', features: ['10 receipt scans/month', '5 barcode scans', 'Basic tax tagging', '1 budget envelope'], cta: 'Start Free', primary: false },
            { plan: 'Pro', price: '$6.99/mo', features: ['Unlimited scans', 'Tax refund estimator', 'PDF export for accountant', 'Price history', 'GST/QST tracking'], cta: 'Go Pro', primary: true },
            { plan: 'Tax Vault', price: '$49/yr', features: ['Everything in Pro', 'CRA audit-ready PDFs', 'Business expense vault', 'Mileage tracker', 'Accountant sharing link'], cta: 'Get Tax Vault', primary: false },
          ].map(({ plan, price, features, cta, primary }) => (
            <div key={plan} className={`glass-card p-6 ${primary ? 'border border-green-400/30 glow-green' : ''}`}>
              <h3 className="font-display font-bold text-xl text-white">{plan}</h3>
              <p className={`text-3xl font-black my-3 ${primary ? 'text-green-400' : 'text-white'}`}>{price}</p>
              <ul className="space-y-2 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check size={14} className="text-green-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/app')} className={primary ? 'btn-primary w-full' : 'btn-secondary w-full'}>{cta}</button>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 mt-16 py-8 text-center text-gray-500 text-sm">
        <p>ReceiptAI © 2025 — Stop throwing money in the trash.</p>
        <p className="mt-2">🇨🇦 🇺🇸 🇲🇽 🇧🇷 🇦🇷 Available across North & South America</p>
      </footer>
    </div>
  )
}
