import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, Upload, X, Loader2, CheckCircle, AlertCircle, 
  Scan, Image as ImageIcon, FileText, DollarSign, Calendar, 
  Building2, Tag, Sparkles, ArrowRight 
} from 'lucide-react'
import { useTransactionStore } from '../../store/transaction.store'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

interface ReceiptData {
  merchant: string
  amount: number
  date: string
  items: string[]
  confidence: number
}

const ReceiptScanner: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<ReceiptData | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { addTransaction } = useTransactionStore()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, etc.)')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    await scanReceipt(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.heic']
    },
    maxFiles: 1,
    multiple: false
  })

  const scanReceipt = async (file: File) => {
    setIsScanning(true)
    
    // Simulate OCR processing (in production, call actual OCR API)
    setTimeout(() => {
      // Mock OCR result
      const mockData: ReceiptData = {
        merchant: 'Local Supermarket',
        amount: Math.floor(Math.random() * 5000) + 100,
        date: new Date().toISOString().split('T')[0],
        items: ['Groceries', 'Dairy Products', 'Snacks'],
        confidence: 0.92
      }
      setScannedData(mockData)
      setIsScanning(false)
      toast.success('Receipt scanned successfully!')
    }, 2000)

    // In production, use actual API:
    /*
    const formData = new FormData()
    formData.append('receipt', file)
    try {
      const response = await api.post('/ocr/scan-receipt', formData)
      setScannedData(response.data)
      toast.success('Receipt scanned successfully!')
    } catch (error) {
      toast.error('Failed to scan receipt')
    } finally {
      setIsScanning(false)
    }
    */
  }

  const handleAddTransaction = async () => {
    if (!scannedData) return

    await addTransaction({
      amount: scannedData.amount,
      type: 'debit',
      category: 'Shopping',
      description: `Purchase at ${scannedData.merchant}`,
      merchant: scannedData.merchant,
      date: scannedData.date,
      tags: ['receipt', 'scanned'],
      notes: `Items: ${scannedData.items.join(', ')}`
    })

    toast.success('Transaction added from receipt!')
    resetScanner()
    onSuccess?.()
  }

  const resetScanner = () => {
    setScannedData(null)
    setPreviewUrl(null)
    setSelectedFile(null)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!previewUrl && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center animate-float">
              <Scan className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {isDragActive ? 'Drop your receipt here' : 'Scan Receipt'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload a photo of your receipt to auto-fill transaction details
              </p>
            </div>
            <div className="flex gap-2 text-xs text-gray-400">
              <span>JPEG, PNG</span>
              <span>•</span>
              <span>Max 5MB</span>
              <span>•</span>
              <span>AI-powered OCR</span>
            </div>
            <button className="mt-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-all flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
          </div>
        </div>
      )}

      {/* Preview & Scanning */}
      {previewUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {/* Image Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img src={previewUrl} alt="Receipt preview" className="w-full max-h-64 object-contain" />
            <button
              onClick={resetScanner}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-lg hover:bg-black/70 transition-all"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            {isScanning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                  <p className="text-white text-sm">AI is scanning your receipt...</p>
                </div>
              </div>
            )}
          </div>

          {/* Scanned Data */}
          <AnimatePresence>
            {scannedData && !isScanning && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-green-800 dark:text-green-400">AI Extracted Data</h3>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    {(scannedData.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Merchant</p>
                      <p className="font-medium text-gray-900 dark:text-white">{scannedData.merchant}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="font-bold text-lg text-green-600">{formatCurrency(scannedData.amount)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">{scannedData.date}</p>
                    </div>
                  </div>

                  {scannedData.items.length > 0 && (
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <p className="text-xs text-gray-500">Items Detected</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {scannedData.items.map((item, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddTransaction}
                    className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Add Transaction
                  </button>
                  <button
                    onClick={resetScanner}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 transition-all"
                  >
                    Scan Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Scan className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-400 text-sm">How it works</h4>
            <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
              Our AI-powered OCR technology extracts merchant name, amount, date, and items from your receipt photos. 
              Just upload a clear image and we'll auto-fill the transaction details for you!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReceiptScanner