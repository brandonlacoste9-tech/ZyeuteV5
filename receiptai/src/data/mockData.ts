import type {
  Receipt, BarcodeProduct, BudgetEnvelope,
  Subscription, UserProfile, MonthlySpend, ScanTip
} from '@/types'

export const mockUser: UserProfile = {
  id: 'user_001',
  name: 'Alex Chen',
  email: 'alex@receiptai.app',
  plan: 'pro',
  region: 'CA',
  language: 'en-CA',
  currency: 'CAD',
  memberSince: '2024-01-15',
  scanStreak: 12,
  totalReceiptsScanned: 847,
  employmentType: 'self_employed',
  estimatedTaxBracket: 0.265,
  vehicleBusinessUsePercent: 50,
  homeOfficePercent: 30,
}

export const mockMonthlySpend: MonthlySpend[] = [
  { month: '2025-02', amount: 2100, label: 'Feb' },
  { month: '2025-03', amount: 1987, label: 'Mar' },
  { month: '2025-04', amount: 2234, label: 'Apr' },
  { month: '2025-05', amount: 1876, label: 'May' },
  { month: '2025-06', amount: 2089, label: 'Jun' },
  { month: '2025-07', amount: 1943, label: 'Jul' },
]

export const mockReceipts: Receipt[] = [
  {
    id: 'rcpt_001',
    storeName: 'IGA Montréal',
    storeCategory: 'grocery',
    date: '2025-07-18',
    totalPaid: 127.43,
    total2022Equivalent: 98.20,
    overpaid: 29.23,
    gst: 0, qst: 0,
    isDeductible: false,
    taxCategory: null,
    deductibleAmount: 0,
    region: 'CA',
    items: [
      { id: 'i1', name: 'Eggs 12pk Burnbrae', qty: 2, unitPrice: 6.99, price2022: 4.79, changePercent: 46, isGouged: true, taxCategory: null, isDeductible: false },
      { id: 'i2', name: 'Chicken Breast (per kg)', qty: 1.8, unitPrice: 11.99, price2022: 8.49, changePercent: 41, isGouged: true, taxCategory: null, isDeductible: false },
      { id: 'i3', name: 'Villaggio Bread', qty: 1, unitPrice: 4.99, price2022: 3.29, changePercent: 52, isGouged: true, taxCategory: null, isDeductible: false },
      { id: 'i4', name: 'Gay Lea Butter 454g', qty: 1, unitPrice: 6.49, price2022: 4.99, changePercent: 30, isGouged: false, taxCategory: null, isDeductible: false },
      { id: 'i5', name: 'Centrum Multivitamins', qty: 1, unitPrice: 18.99, price2022: 14.99, changePercent: 27, isGouged: false, taxCategory: 'medical', isDeductible: true },
    ],
  },
  {
    id: 'rcpt_002',
    storeName: 'Shell — Autoroute 40',
    storeCategory: 'gas',
    date: '2025-07-17',
    totalPaid: 94.20,
    total2022Equivalent: 71.89,
    overpaid: 22.31,
    gst: 4.71, qst: 5.86,
    isDeductible: true,
    taxCategory: 'vehicle',
    deductibleAmount: 47.10,
    region: 'CA',
    items: [
      { id: 'g1', name: 'Regular 94L Gasoline', qty: 62.8, unitPrice: 1.50, price2022: 1.145, changePercent: 31, isGouged: false, taxCategory: 'vehicle', isDeductible: true },
    ],
  },
  {
    id: 'rcpt_003',
    storeName: 'Bureau en Gros (Staples)',
    storeCategory: 'office_supply',
    date: '2025-07-15',
    totalPaid: 187.54,
    total2022Equivalent: 167.50,
    overpaid: 20.04,
    gst: 9.38, qst: 11.67,
    isDeductible: true,
    taxCategory: 'business',
    deductibleAmount: 187.54,
    region: 'CA',
    items: [
      { id: 'o1', name: 'HP Printer Ink Set', qty: 1, unitPrice: 54.99, price2022: 49.99, changePercent: 10, isGouged: false, taxCategory: 'business', isDeductible: true },
      { id: 'o2', name: 'USB-C Hub Anker', qty: 1, unitPrice: 67.99, price2022: 59.99, changePercent: 13, isGouged: false, taxCategory: 'business', isDeductible: true },
      { id: 'o3', name: 'Notebooks 5pk', qty: 2, unitPrice: 14.99, price2022: 12.99, changePercent: 15, isGouged: false, taxCategory: 'business', isDeductible: true },
    ],
  },
  {
    id: 'rcpt_004',
    storeName: 'Jean Coutu Pharmaprix',
    storeCategory: 'pharmacy',
    date: '2025-07-14',
    totalPaid: 89.67,
    total2022Equivalent: 74.20,
    overpaid: 15.47,
    gst: 0, qst: 0,
    isDeductible: true,
    taxCategory: 'medical',
    deductibleAmount: 89.67,
    region: 'CA',
    items: [
      { id: 'p1', name: 'Advil 200ct', qty: 1, unitPrice: 24.99, price2022: 19.99, changePercent: 25, isGouged: false, taxCategory: 'medical', isDeductible: true },
      { id: 'p2', name: 'Prescription Rx', qty: 1, unitPrice: 34.50, price2022: 29.00, changePercent: 19, isGouged: false, taxCategory: 'medical', isDeductible: true },
      { id: 'p3', name: 'Vitamin D 1000IU', qty: 1, unitPrice: 16.99, price2022: 13.99, changePercent: 21, isGouged: false, taxCategory: 'medical', isDeductible: true },
    ],
  },
  {
    id: 'rcpt_005',
    storeName: 'Le Plateau Bistro',
    storeCategory: 'dining',
    date: '2025-07-12',
    totalPaid: 134.50,
    total2022Equivalent: 114.00,
    overpaid: 20.50,
    gst: 6.73, qst: 8.37,
    isDeductible: true,
    taxCategory: 'business',
    deductibleAmount: 67.25,
    region: 'CA',
    items: [
      { id: 'd1', name: 'Client Lunch (2 guests)', qty: 1, unitPrice: 134.50, price2022: 114.00, changePercent: 18, isGouged: false, taxCategory: 'business', isDeductible: true },
    ],
  },
  {
    id: 'rcpt_006',
    storeName: 'Maxi Lasalle',
    storeCategory: 'grocery',
    date: '2025-07-10',
    totalPaid: 203.78,
    total2022Equivalent: 165.50,
    overpaid: 38.28,
    gst: 0, qst: 0,
    isDeductible: false,
    taxCategory: null,
    deductibleAmount: 0,
    region: 'CA',
    items: [
      { id: 'm1', name: 'Salmon Fillet 1.2kg', qty: 1, unitPrice: 28.99, price2022: 19.99, changePercent: 45, isGouged: true, taxCategory: null, isDeductible: false },
      { id: 'm2', name: 'Tropicana OJ 1.89L', qty: 2, unitPrice: 7.49, price2022: 5.49, changePercent: 36, isGouged: true, taxCategory: null, isDeductible: false },
      { id: 'm3', name: 'Folgers Coffee 925g', qty: 1, unitPrice: 17.99, price2022: 12.99, changePercent: 38, isGouged: true, taxCategory: null, isDeductible: false },
      { id: 'm4', name: 'Barilla Pasta 900g', qty: 3, unitPrice: 3.49, price2022: 2.49, changePercent: 40, isGouged: true, taxCategory: null, isDeductible: false },
    ],
  },
  {
    id: 'rcpt_007',
    storeName: 'Canadian Tire',
    storeCategory: 'other',
    date: '2025-07-07',
    totalPaid: 247.89,
    total2022Equivalent: 219.99,
    overpaid: 27.90,
    gst: 12.39, qst: 15.43,
    isDeductible: true,
    taxCategory: 'vehicle',
    deductibleAmount: 123.95,
    region: 'CA',
    items: [
      { id: 'c1', name: 'Motor Oil 5W-30 5L', qty: 1, unitPrice: 42.99, price2022: 37.99, changePercent: 13, isGouged: false, taxCategory: 'vehicle', isDeductible: true },
      { id: 'c2', name: 'Windshield Wipers Set', qty: 1, unitPrice: 34.99, price2022: 29.99, changePercent: 17, isGouged: false, taxCategory: 'vehicle', isDeductible: true },
      { id: 'c3', name: 'Jumper Cables', qty: 1, unitPrice: 59.99, price2022: 54.99, changePercent: 9, isGouged: false, taxCategory: 'vehicle', isDeductible: true },
    ],
  },
]

export const mockBarcodeProducts: BarcodeProduct[] = [
  {
    id: 'bp_001', barcode: '056749765403',
    name: 'Burnbrae Farms Eggs 12pk', brand: 'Burnbrae',
    category: 'grocery', currentPrice: 6.99, price2022: 4.79, changePercent: 46, nutritionGrade: 'A',
    storePrices: [
      { store: 'Maxi', price: 5.99, isCheapest: true },
      { store: 'IGA', price: 6.99, isCheapest: false },
      { store: 'Metro', price: 7.29, isCheapest: false },
      { store: 'Walmart', price: 6.49, isCheapest: false },
    ],
  },
  {
    id: 'bp_002', barcode: '068100086461',
    name: 'Tropicana OJ 1.89L', brand: 'Tropicana',
    category: 'grocery', currentPrice: 7.49, price2022: 5.49, changePercent: 36, nutritionGrade: 'B',
    storePrices: [
      { store: 'Maxi', price: 6.49, isCheapest: true },
      { store: 'IGA', price: 7.49, isCheapest: false },
      { store: 'Walmart', price: 6.97, isCheapest: false },
    ],
  },
  {
    id: 'bp_003', barcode: '076808001464',
    name: 'Folgers Coffee Classic 925g', brand: 'Folgers',
    category: 'grocery', currentPrice: 17.99, price2022: 12.99, changePercent: 38, nutritionGrade: 'N/A',
    storePrices: [
      { store: 'Costco', price: 14.99, isCheapest: true },
      { store: 'Walmart', price: 16.97, isCheapest: false },
      { store: 'IGA', price: 17.99, isCheapest: false },
    ],
  },
  {
    id: 'bp_004', barcode: '011111001490',
    name: 'Advil 200ct', brand: 'Advil',
    category: 'pharmacy', currentPrice: 24.99, price2022: 19.99, changePercent: 25, nutritionGrade: 'N/A',
    storePrices: [
      { store: 'Costco', price: 18.99, isCheapest: true },
      { store: 'Walmart', price: 21.97, isCheapest: false },
      { store: 'Pharmaprix', price: 24.99, isCheapest: false },
    ],
  },
]

export const mockBudgetEnvelopes: BudgetEnvelope[] = [
  { id: 'bud_1', category: 'grocery', label: 'Groceries', icon: '🛒', budgetAmount: 800, spentAmount: 623, color: '#00FF85' },
  { id: 'bud_2', category: 'dining', label: 'Dining Out', icon: '🍽️', budgetAmount: 300, spentAmount: 287, color: '#FF9500' },
  { id: 'bud_3', category: 'gas', label: 'Gas & Transport', icon: '⛽', budgetAmount: 200, spentAmount: 134, color: '#00B4D8' },
  { id: 'bud_4', category: 'subscription', label: 'Subscriptions', icon: '📱', budgetAmount: 150, spentAmount: 147, color: '#EF476F' },
  { id: 'bud_5', category: 'medical', label: 'Medical', icon: '🏥', budgetAmount: 100, spentAmount: 34, color: '#06D6A0' },
  { id: 'bud_6', category: 'general', label: 'Other', icon: '🎯', budgetAmount: 400, spentAmount: 201, color: '#9B5DE5' },
]

export const mockSubscriptions: Subscription[] = [
  { id: 'sub_1', name: 'Netflix', monthlyCost: 22.99, lastUsed: '2025-07-18', category: 'Entertainment', icon: '🎬', isActive: true, daysSinceUsed: 0 },
  { id: 'sub_2', name: 'Spotify', monthlyCost: 11.99, lastUsed: '2025-07-17', category: 'Music', icon: '🎵', isActive: true, daysSinceUsed: 1 },
  { id: 'sub_3', name: 'Adobe Creative Cloud', monthlyCost: 87.49, lastUsed: '2025-07-16', category: 'Software', icon: '🎨', isActive: true, daysSinceUsed: 2 },
  { id: 'sub_4', name: 'Duolingo Plus', monthlyCost: 7.99, lastUsed: '2025-04-02', category: 'Education', icon: '🦉', isActive: true, daysSinceUsed: 107 },
  { id: 'sub_5', name: 'LinkedIn Premium', monthlyCost: 44.99, lastUsed: '2025-06-01', category: 'Professional', icon: '💼', isActive: true, daysSinceUsed: 47 },
  { id: 'sub_6', name: 'Calm App', monthlyCost: 6.99, lastUsed: '2025-03-15', category: 'Wellness', icon: '🧘', isActive: true, daysSinceUsed: 125 },
  { id: 'sub_7', name: 'Random Gaming Sub', monthlyCost: 12.99, lastUsed: '2025-02-28', category: 'Gaming', icon: '🎮', isActive: true, daysSinceUsed: 140 },
]

export const mockFinancialSummary = {
  receiptsSaved: 847,
  receiptsThisMonth: 23,
  inflationOverpaidYTD: 1247.83,
  taxDeductionsTracked: 3847.23,
  estimatedRefund: 1019.52,
  gstPaidYTD: 312.40,
  qstPaidYTD: 384.80,
  rageScore: 74,
  topGougedItem: 'Eggs (+46%)',
  monthlySpend: mockMonthlySpend,
  categoryBreakdown: [
    { category: 'Groceries', amount: 623, percent: 32, color: '#00FF85' },
    { category: 'Dining', amount: 287, percent: 15, color: '#FF9500' },
    { category: 'Gas', amount: 134, percent: 7, color: '#00B4D8' },
    { category: 'Subscriptions', amount: 147, percent: 8, color: '#EF476F' },
    { category: 'Medical', amount: 34, percent: 2, color: '#06D6A0' },
    { category: 'Other', amount: 718, percent: 37, color: '#9B5DE5' },
  ],
}

export const mockScanTips: ScanTip[] = [
  {
    id: 'tip_gas', storeCategory: 'gas', region: 'CA',
    headline: { 'en-CA': '⛽ Gas = Money Back if You Drive for Work', 'fr-CA': '⛽ Essence = Argent si vous travaillez en auto', 'en-US': '⛽ Gas = Tax Deduction for Business', 'es-MX': '⛽ Gasolina = Deducción fiscal', 'pt-BR': '⛽ Combustível = Dedução fiscal', 'es-AR': '⛽ Nafta = Deducción si usás el auto para trabajar' },
    explanation: { 'en-CA': 'Keep ALL gas receipts. If you use your car for work, a % is deductible. Over a year this can mean $400-800 back.', 'fr-CA': 'Gardez TOUS vos reçus d\'essence. Un pourcentage est déductible si vous utilisez votre voiture pour le travail.', 'en-US': 'Track every gas receipt. Business mileage at 67¢/mile is deductible on Schedule C.', 'es-MX': 'Guarda todos los recibos con CFDI. Los gastos de transporte para negocios son deducibles.', 'pt-BR': 'Guarde todos os recibos. Despesas de transporte a trabalho são dedutíveis.', 'es-AR': 'Guardá todos los comprobantes. Los gastos de auto para trabajar son deducibles.' },
    taxCategory: 'vehicle',
    actionLabel: { 'en-CA': 'Tag as Vehicle Expense', 'fr-CA': 'Marquer comme dépense véhicule', 'en-US': 'Tag as Vehicle Expense', 'es-MX': 'Marcar como gasto de transporte', 'pt-BR': 'Marcar como despesa de transporte', 'es-AR': 'Marcar como gasto de vehículo' },
  },
  {
    id: 'tip_pharmacy', storeCategory: 'pharmacy', region: 'CA',
    headline: { 'en-CA': '💊 Keep ALL Pharmacy Receipts — They Add Up Fast', 'fr-CA': '💊 Gardez TOUS vos reçus de pharmacie', 'en-US': '💊 Medical Expenses Are Deductible if >7.5% of Income', 'es-MX': '💊 Gastos médicos son 100% deducibles con CFDI', 'pt-BR': '💊 Despesas médicas são dedutíveis sem limite', 'es-AR': '💊 Gastos médicos son deducibles hasta el 40%' },
    explanation: { 'en-CA': 'Prescriptions, vitamins prescribed by a doctor, medical devices — all deductible. No minimum threshold in Canada.', 'fr-CA': 'Ordonnances, vitamines prescrites, appareils médicaux — tout est déductible. Pas de seuil minimum au Canada.', 'en-US': 'If medical expenses exceed 7.5% of AGI, the excess is deductible. Track everything.', 'es-MX': 'Todos los gastos médicos y dentales con CFDI son 100% deducibles. Sin límite máximo.', 'pt-BR': 'Despesas médicas, dentárias e hospitalares são dedutíveis sem limite.', 'es-AR': 'El 40% de los gastos médicos no cubiertos por la obra social son deducibles.' },
    taxCategory: 'medical',
    actionLabel: { 'en-CA': 'Tag as Medical Expense', 'fr-CA': 'Marquer comme dépense médicale', 'en-US': 'Tag as Medical Expense', 'es-MX': 'Marcar como gasto médico', 'pt-BR': 'Marcar como despesa médica', 'es-AR': 'Marcar como gasto médico' },
  },
  {
    id: 'tip_office', storeCategory: 'office_supply', region: 'CA',
    headline: { 'en-CA': '💼 Office Supplies = 100% Business Deduction', 'fr-CA': '💼 Fournitures de bureau = 100% déductible', 'en-US': '💼 Office Supplies = 100% Deductible on Schedule C', 'es-MX': '💼 Artículos de oficina = 100% deducibles con CFDI', 'pt-BR': '💼 Material de escritório = 100% dedutível', 'es-AR': '💼 Material de oficina = deducción por trabajo' },
    explanation: { 'en-CA': 'If you\'re self-employed or work from home, office supplies are fully deductible. This receipt alone could save you $50+ in taxes.', 'fr-CA': 'Les fournitures de bureau sont entièrement déductibles pour les travailleurs autonomes.', 'en-US': 'All office supplies are deductible expenses on Schedule C for self-employed.', 'es-MX': 'Si eres trabajador independiente, los artículos de oficina con CFDI son 100% deducibles.', 'pt-BR': 'Material de escritório é totalmente dedutível no livro-caixa para autônomos.', 'es-AR': 'El material de oficina es deducible como gasto de la actividad para independientes.' },
    taxCategory: 'business',
    actionLabel: { 'en-CA': 'Tag as Business Expense', 'fr-CA': 'Marquer comme dépense d\'affaires', 'en-US': 'Tag as Business Expense', 'es-MX': 'Marcar como gasto de negocio', 'pt-BR': 'Marcar como despesa comercial', 'es-AR': 'Marcar como gasto de trabajo' },
  },
  {
    id: 'tip_dining', storeCategory: 'dining', region: 'CA',
    headline: { 'en-CA': '🍽️ Business Meal? Save 50% of This Receipt', 'fr-CA': '🍽️ Repas d\'affaires? Récupérez 50%', 'en-US': '🍽️ Business Meal = 50% Deductible', 'es-MX': '🍽️ ¿Comida de negocios? Es deducible con CFDI', 'pt-BR': '🍽️ Refeição de negócios é parcialmente dedutível', 'es-AR': '🍽️ ¿Comida de trabajo? Podría ser deducible' },
    explanation: { 'en-CA': 'Client lunch? Business meeting over dinner? 50% of the meal is deductible. Note who you ate with and the business purpose.', 'fr-CA': 'Dîner avec un client? 50% du repas est déductible. Notez avec qui vous avez mangé.', 'en-US': 'Business meals with clients are 50% deductible. Document who, where, and the business purpose.', 'es-MX': 'Los alimentos con clientes son deducibles con CFDI. Anota con quién y el propósito.', 'pt-BR': 'Refeições com clientes são parcialmente dedutíveis. Anote com quem e o propósito.', 'es-AR': 'Las comidas de trabajo pueden ser parcialmente deducibles. Documentá con quién y el motivo.' },
    taxCategory: 'business',
    actionLabel: { 'en-CA': 'Tag as Business Meal (50%)', 'fr-CA': 'Marquer comme repas d\'affaires (50%)', 'en-US': 'Tag as Business Meal (50%)', 'es-MX': 'Marcar como alimento de negocios', 'pt-BR': 'Marcar como refeição de negócios', 'es-AR': 'Marcar como comida de trabajo' },
  },
]

export const getRandomReceipt = () =>
  mockReceipts[Math.floor(Math.random() * mockReceipts.length)]

export const getScanTipForCategory = (category: string): ScanTip | null =>
  mockScanTips.find(t => t.storeCategory === category) ?? null
