import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Upload, CheckCircle, Tag, Wallet, Calculator, Share2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getRandomReceipt, getScanTipForCategory } from '@/data/mockData'
import { formatCurrency, generateReceiptId, simulateScan, cn } from '@/lib/utils'
import type { Receipt, ScanTip } from '@/types'

const SCAN_MESSAGES = [
  'Reading your receipt...',
  'Detecting price gouging...',
  'Checking 2022 prices...',
  'Finding your deductions...',
  'Calculating your refund...',
  'Truth incoming...',
]

export function ScanPage() {
  const { addReceipt } = useStore()
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanMessage, setScanMessage] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<Receipt | null>(null)
  const [tip, setTip] = useState<ScanTip | null>(null)

  const runScan = useCallback(async () => {
    setIsScanning(true)
    setResult(null)
    for (let i = 0; i < SCAN_MESSAGES.length; i++) {
      setScanMessage(SCAN_MESSAGES[i])
      setScanProgress(((i + 1) / SCAN_MESSAGES.length) * 100)
      await simulateScan()
    }
    const mockResult: Receipt = { ...getRandomReceipt(), id: generateReceiptId(), date: new Date().toISOString().split('T')[0] }
    setResult(mockResult)
    setTip(getScanTipForCategory(mockResult.storeCategory))
    setIsScanning(false)
    setScanProgress(0)
    toast.success('Truth unlocked. 🔥 Brace yourself.')
  }, [])

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    await runScan()
  }, [runScan])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [], 'application/pdf': [] }, multiple: false, disabled: isScanning,
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">📸 Scan Receipt</h1>
        <p className="text-gray-400 text-sm mt-1">Every receipt you scan could be money back in your pocket.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div {...getRootProps()} className={cn('upload-zone min-h-[280px] flex flex-col items-center justify-center gap-4', isDragActive && 'dragging', isScanning && 'pointer-events-none')}>
            <input {...getInputProps()} />
            {isScanning ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="relative w-32 h-40 border-2 border-green-400/40 rounded-lg overflow-hidden bg-white/5">
                  {preview && <img src={preview} alt="Receipt" className="w-full h-full object-cover opacity-50" />}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-green-400"
                    style={{ boxShadow: '0 0 10px rgba(0,255,133,0.8)' }}
                    animate={{ y: ['0%', '160px', '0%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{scanMessage}</span>
                    <span>{Math.round(scanProgress)}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-green-400 rounded-full" animate={{ width: `${scanProgress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                </div>
              </div>
            ) : preview && result ? (
              <div className="flex flex-col items-center gap-2">
                <img src={preview} alt="Receipt" className="max-h-48 rounded-lg opacity-80" />
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={16} /><span className="text-sm font-medium">Scanned!</span>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                  <Upload size={28} className="text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">Drop your receipt here or click to upload</p>
                  <p className="text-gray-500 text-sm mt-1">Supports JPG, PNG, PDF</p>
                </div>
                <button onClick={() => runScan()} className="btn-secondary text-sm px-4 py-2">
                  Demo scan (no image needed)
                </button>
              </>
            )}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2">
                <button onClick={() => { addReceipt(result); toast.success('Saved to wallet! 🧾') }} className="btn-primary flex items-center gap-2 text-sm">
                  <Wallet size={16} /> Save to Wallet
                </button>
                <button className="btn-secondary flex items-center gap-2 text-sm"><Calculator size={16} /> Add to Tax Vault</button>
                <button className="btn-secondary flex items-center gap-2 text-sm"><Share2 size={16} /> Share Card</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="glass-card p-4">
                <h3 className="font-display font-semibold text-white mb-3">{result.storeName}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-400">Total Paid</p><p className="font-bold text-white text-lg">{formatCurrency(result.totalPaid)}</p></div>
                  <div><p className="text-xs text-gray-400">2022 Equivalent</p><p className="font-bold text-gray-300 text-lg">{formatCurrency(result.total2022Equivalent)}</p></div>
                  <div><p className="text-xs text-gray-400">You Overpaid</p><p className="font-bold text-red-400 text-lg">+{formatCurrency(result.overpaid)}</p></div>
                  {result.deductibleAmount > 0 && <div><p className="text-xs text-gray-400">Deductible</p><p className="font-bold text-green-400 text-lg">{formatCurrency(result.deductibleAmount)}</p></div>}
                </div>
              </div>

              {tip && (
                <div className="glass-card p-4 border border-green-400/20">
                  <div className="flex gap-3">
                    <div className="text-2xl">💡</div>
                    <div>
                      <p className="text-sm font-semibold text-green-400 mb-1">{tip.headline['en-CA']}</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{tip.explanation['en-CA']}</p>
                      <button className="mt-2 btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Tag size={12} />{tip.actionLabel['en-CA']}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="glass-card overflow-hidden">
                <div className="p-3 border-b border-white/5"><h4 className="font-semibold text-white text-sm">Line Items</h4></div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-2 text-gray-400">Item</th>
                      <th className="text-right p-2 text-gray-400">Paid</th>
                      <th className="text-right p-2 text-gray-400">2022</th>
                      <th className="text-right p-2 text-gray-400">+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((item) => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-2 text-white">
                          {item.name}
                          {item.isGouged && <span className="ml-1 rage-badge">🚨</span>}
                          {item.isDeductible && <span className="ml-1 deductible-badge">✓</span>}
                        </td>
                        <td className="p-2 text-right text-white">${item.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-right text-gray-400">${item.price2022.toFixed(2)}</td>
                        <td className={cn('p-2 text-right font-bold', item.changePercent > 0 ? 'text-red-400' : 'text-green-400')}>
                          {item.changePercent > 0 ? '+' : ''}{item.changePercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
