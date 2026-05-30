import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  resources: {
    'en-CA': { translation: {
      nav: { dashboard: 'Dashboard', scan: 'Scan Receipt', wallet: 'Receipt Wallet', tax: 'Tax Vault', budget: 'Budget', prices: 'Price Memory', insights: 'Insights', deductions: 'Tax Deductions', share: 'Share', settings: 'Settings' },
      scan: { dropzone: 'Drop your receipt here or click to upload', success: 'Truth unlocked. 🔥 Brace yourself.', saveWallet: 'Save to Wallet', addTaxVault: 'Add to Tax Vault', shareCard: 'Generate Share Card' },
      mascot: { empty: "Ton wallet est vide, mon ami. Scanne ta première facture!", tip1: "Garde ben tes factures, mon ami!", milestone: "Ostie, t'as trouvé ${{amount}} en déductions!" },
    }},
    'fr-CA': { translation: {
      nav: { dashboard: 'Tableau de bord', scan: 'Scanner un reçu', wallet: 'Portefeuille', tax: 'Coffre-fort fiscal', budget: 'Budget', prices: 'Mémoire des prix', insights: 'Aperçus', deductions: 'Déductions fiscales', share: 'Partager', settings: 'Paramètres' },
      scan: { dropzone: 'Déposez votre reçu ici ou cliquez pour télécharger', success: 'Vérité dévoilée. 🔥 Préparez-vous.', saveWallet: 'Sauvegarder au portefeuille', addTaxVault: 'Ajouter au coffre-fort', shareCard: 'Générer une carte' },
      mascot: { empty: "Ton wallet est vide, mon ami. Scanne ta première facture!", tip1: "Garde ben tes factures, mon ami!", milestone: "TABARNAK! T'as trouvé ${{amount}} en déductions!" },
    }},
    'en-US': { translation: {
      nav: { dashboard: 'Dashboard', scan: 'Scan Receipt', wallet: 'Receipt Wallet', tax: 'Tax Vault', budget: 'Budget', prices: 'Price Memory', insights: 'Insights', deductions: 'Tax Deductions', share: 'Share', settings: 'Settings' },
      scan: { dropzone: 'Drop your receipt here or click to upload', success: 'Truth unlocked. 🔥 Brace yourself.', saveWallet: 'Save to Wallet', addTaxVault: 'Add to Tax Vault', shareCard: 'Generate Share Card' },
      mascot: { empty: "Your wallet is empty. Start scanning — every receipt is money.", tip1: "Keep all your receipts — they're money!", milestone: "You've found ${{amount}} in deductions!" },
    }},
    'es-MX': { translation: {
      nav: { dashboard: 'Panel', scan: 'Escanear Factura', wallet: 'Cartera', tax: 'Bóveda Fiscal', budget: 'Presupuesto', prices: 'Precios', insights: 'Análisis', deductions: 'Deducciones', share: 'Compartir', settings: 'Configuración' },
      scan: { dropzone: 'Arrastra tu factura aquí o haz clic', success: 'Verdad revelada. 🔥 Prepárate.', saveWallet: 'Guardar en Cartera', addTaxVault: 'Agregar a Bóveda', shareCard: 'Generar Tarjeta' },
      mascot: { empty: "Tu cartera está vacía. ¡Escanea tu primera factura!", tip1: "¡Guarda todas tus facturas con CFDI!", milestone: "¡Encontraste ${{amount}} en deducciones!" },
    }},
    'pt-BR': { translation: {
      nav: { dashboard: 'Painel', scan: 'Escanear Nota', wallet: 'Carteira', tax: 'Cofre Fiscal', budget: 'Orçamento', prices: 'Preços', insights: 'Análises', deductions: 'Deduções', share: 'Compartilhar', settings: 'Configurações' },
      scan: { dropzone: 'Arraste sua nota aqui ou clique para enviar', success: 'Verdade revelada. 🔥 Prepare-se.', saveWallet: 'Salvar na Carteira', addTaxVault: 'Adicionar ao Cofre', shareCard: 'Gerar Cartão' },
      mascot: { empty: "Sua carteira está vazia. Escaneie sua primeira nota!", tip1: "Guarde todas as suas notas fiscais!", milestone: "Você encontrou R${{amount}} em deduções!" },
    }},
    'es-AR': { translation: {
      nav: { dashboard: 'Panel', scan: 'Escanear Comprobante', wallet: 'Cartera', tax: 'Bóveda Fiscal', budget: 'Presupuesto', prices: 'Precios', insights: 'Análisis', deductions: 'Deducciones', share: 'Compartir', settings: 'Configuración' },
      scan: { dropzone: 'Arrastrá tu comprobante o hacé clic para subir', success: 'Verdad revelada. 🔥 Preparate.', saveWallet: 'Guardar en Cartera', addTaxVault: 'Agregar a Bóveda', shareCard: 'Generar Tarjeta' },
      mascot: { empty: "Che, tu cartera está vacía. ¡Escaneá tu primer comprobante!", tip1: "¡Guardá todos tus comprobantes!", milestone: "¡Encontraste ${{amount}} en deducciones!" },
    }},
  },
  lng: 'en-CA',
  fallbackLng: 'en-CA',
  interpolation: { escapeValue: false },
})

export default i18n
