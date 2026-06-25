import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, Calendar, FileText, Building2, 
  ArrowUpCircle, ArrowDownCircle, AlertCircle, 
  CheckCircle, Upload, X, Camera, Receipt, Tag,
  Briefcase, Home, Coffee, ShoppingCart, Car, Heart, 
  Book, Music, Film, Plane, TrendingUp, User
} from 'lucide-react'
import { useTransactionStore } from '../../store/transaction.store'
import { CATEGORIES } from '../../utils/constants'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

// Fixed schema - amount as string then transform to number
const schema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .transform((val) => {
      const num = parseFloat(val)
      if (isNaN(num)) throw new Error('Please enter a valid number')
      return num
    })
    .pipe(z.number()
      .min(0.01, 'Amount must be at least $0.01')
      .max(999999.99, 'Amount exceeds maximum limit')
    ),
  type: z.enum(['credit', 'debit']),
  category: z.string().min(1, 'Please select a category'),
  description: z.string()
    .min(3, 'Description must be at least 3 characters')
    .max(100, 'Description cannot exceed 100 characters'),
  merchant: z.string()
    .min(2, 'Merchant name must be at least 2 characters')
    .max(50, 'Merchant name cannot exceed 50 characters'),
  date: z.string().min(1, 'Please select a date'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  receipt: z.any().optional(),
})

type FormData = z.infer<typeof schema>

// Alternative: Use number with coerce
// const schema = z.object({
//   amount: z.coerce.number()
//     .min(0.01, 'Amount must be at least $0.01')
//     .max(999999.99, 'Amount exceeds maximum limit'),
//   ...
// })

const FormInput = ({ label, name, icon: Icon, register, error, type = 'text', placeholder, required }: any) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
      <Icon className="w-4 h-4 text-gray-500" />
      {label}
      {required && <span className="text-red-500 text-xs">*</span>}
    </label>
    <input
      {...register(name)}
      type={type}
      step={type === 'number' ? '0.01' : undefined}
      placeholder={placeholder}
      className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 rounded-xl transition-all ${
        error ? 'border-red-500 bg-red-50' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
      }`}
    />
    {error && <p className="flex items-center gap-1 text-red-500 text-xs mt-1"><AlertCircle className="w-3 h-3" />{error.message}</p>}
  </motion.div>
)

const FormSelect = ({ label, name, icon: Icon, register, error, options, required }: any) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
      <Icon className="w-4 h-4 text-gray-500" />
      {label}
      {required && <span className="text-red-500 text-xs">*</span>}
    </label>
    <select {...register(name)} className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 rounded-xl cursor-pointer ${
      error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
    }`}>
      <option value="">Select {label}</option>
      {options.map((opt: any) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
    </select>
    {error && <p className="text-red-500 text-xs">{error.message}</p>}
  </motion.div>
)

const TagInput = ({ tags, onChange }: any) => {
  const [inputValue, setInputValue] = useState('')
  const handleAddTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onChange([...tags, inputValue.trim()])
      setInputValue('')
    }
  }
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Tag className="w-4 h-4 text-gray-500" /> Tags (Optional)
      </label>
      <div className="flex gap-2">
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="Add tags" className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-2 rounded-xl" />
        <button type="button" onClick={handleAddTag} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl">Add</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {tags.map((tag: string, idx: number) => (
          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-lg text-sm">#{tag}<button onClick={() => onChange(tags.filter((t: string) => t !== tag))}><X className="w-3 h-3" /></button></span>
        ))}
      </div>
    </div>
  )
}

// Main Component
const TransactionForm: React.FC<{
  transaction?: any
  onSuccess?: () => void
  onCancel?: () => void
  isOpen?: boolean
}> = ({ transaction, onSuccess, onCancel, isOpen = true }) => {
  const { addTransaction, updateTransaction, isLoading } = useTransactionStore()
  const [tags, setTags] = useState<string[]>(transaction?.tags || [])
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: transaction ? {
      ...transaction,
      amount: transaction.amount?.toString() || '',
      date: transaction.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    } : { 
      type: 'debit',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      tags: [],
    },
  })

  const type = watch('type')
  const amount = watch('amount')
  const categories = type === 'credit' ? CATEGORIES.INCOME : CATEGORIES.EXPENSES

  const onSubmit = async (data: any) => {
    try {
      const formData = {
        ...data,
        tags,
      }
      
      if (transaction) {
        await updateTransaction(transaction._id, formData)
        toast.success('Transaction updated successfully!')
      } else {
        await addTransaction(formData)
        toast.success('Transaction added successfully!')
        reset({
          type: 'debit',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          merchant: '',
          category: '',
          notes: '',
        })
        setTags([])
      }
      onSuccess?.()
      onCancel?.()
    } catch (error) {
      toast.error(transaction ? 'Failed to update transaction' : 'Failed to add transaction')
    }
  }

  const handleClose = () => onCancel?.()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={handleClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative">
          <button onClick={handleClose} className="absolute top-4 right-4 z-20 p-2 bg-white/90 dark:bg-gray-800/90 hover:bg-white rounded-xl transition-all group shadow-lg">
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          </button>

          <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-6 py-8 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">{type === 'credit' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}</div>
              <div>
                <h2 className="text-2xl font-bold">{transaction ? 'Edit Transaction' : 'New Transaction'}</h2>
                <p className="text-white/80 text-sm mt-1">{transaction ? 'Update your transaction details' : 'Add a new transaction to track your finances'}</p>
              </div>
            </div>
            {amount && parseFloat(amount) > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-white/20 rounded-xl inline-block">
                <p className="text-xs text-white/80">Amount</p>
                <p className={`text-2xl font-bold ${type === 'credit' ? 'text-green-300' : 'text-red-300'}`}>
                  {type === 'credit' ? '+' : '-'}{formatCurrency(parseFloat(amount))}
                </p>
              </motion.div>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Transaction Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('type', 'credit')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    type === 'credit'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <ArrowUpCircle className={`w-6 h-6 mx-auto mb-2 ${type === 'credit' ? 'text-green-500' : 'text-gray-400'}`} />
                  <p className={`font-medium ${type === 'credit' ? 'text-green-500' : 'text-gray-600'}`}>Income</p>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('type', 'debit')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    type === 'debit'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <ArrowDownCircle className={`w-6 h-6 mx-auto mb-2 ${type === 'debit' ? 'text-red-500' : 'text-gray-400'}`} />
                  <p className={`font-medium ${type === 'debit' ? 'text-red-500' : 'text-gray-600'}`}>Expense</p>
                </button>
              </div>

              <FormSelect
                label="Category"
                name="category"
                icon={Tag}
                register={register}
                error={errors.category}
                options={categories}
                required
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput 
                  label="Amount" 
                  name="amount" 
                  icon={DollarSign} 
                  register={register} 
                  error={errors.amount} 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  required 
                />
                <FormInput label="Date" name="date" icon={Calendar} register={register} error={errors.date} type="date" required />
              </div>

              <FormInput label="Description" name="description" icon={FileText} register={register} error={errors.description} placeholder="e.g., Grocery shopping" required />
              <FormInput label="Merchant/Source" name="merchant" icon={Building2} register={register} error={errors.merchant} placeholder="e.g., Walmart" required />
              <FormInput label="Notes (Optional)" name="notes" icon={FileText} register={register} error={errors.notes} placeholder="Additional notes" />
              <TagInput tags={tags} onChange={setTags} />

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSubmitting || isLoading} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                  {isSubmitting || isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle className="w-5 h-5" />{transaction ? 'Update' : 'Add'} Transaction</>}
                </button>
                <button type="button" onClick={handleClose} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 rounded-xl font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default TransactionForm