import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Layout } from '@/components/layout/Layout'
import { LandingPage } from '@/pages/LandingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ScanPage } from '@/pages/ScanPage'
import {
  WalletPage, TaxPage, BudgetPage, PricesPage,
  InsightsPage, DeductionsPage, SharePage, SettingsPage,
} from '@/pages/PageStubs'

export default function App() {
  return (
    <Router>
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#1A1E32', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
        success: { iconTheme: { primary: '#00FF85', secondary: '#0D0F1A' } },
        error: { iconTheme: { primary: '#FF3B30', secondary: '#0D0F1A' } },
      }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="tax" element={<TaxPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="prices" element={<PricesPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="deductions" element={<DeductionsPage />} />
          <Route path="share" element={<SharePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  )
}
