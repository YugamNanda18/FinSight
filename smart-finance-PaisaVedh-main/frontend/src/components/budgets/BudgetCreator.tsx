import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, DollarSign, Tag, AlertCircle, CheckCircle } from 'lucide-react'
import { useMutation, useQueryClient } from 'react-query'
import { budgetService } from '../../services/api'
import { CATEGORIES } from '../../utils/constants'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

interface BudgetCreatorProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const BudgetCreator: React.FC<BudgetCreatorProps> = ({ onSuccess, onCancel }) => {
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [alertThreshold, setAlertThreshold] = useState(80)
  const [alerts, setAlerts] = useState(true)
  const queryClient = useQueryClient()

  const createMutation = useMutation(
    (data: { category: string; amount: number; alertThreshold: number; alerts: boolean }) => 
      budgetService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('budgets')
        toast.success('Budget created successfully!')
        onSuccess?.()
      },
      onError: (error: any) => {
        console.error('Create budget error:', error)
        const message = error?.response?.data?.message || error?.message || 'Failed to create budget'
        toast.error(message)
      },
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) {
      toast.error('Please select a category')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    createMutation.mutate({
      category,
      amount: parseFloat(amount),
      alertThreshold,
      alerts,
    })
  }

  const selectedCategoryInfo = CATEGORIES.EXPENSES.find(c => c.value === category)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Select Category
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
            {CATEGORIES.EXPENSES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-xl text-left transition-all ${
                  category === cat.value
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-lg mr-2">{cat.icon}</span>
                <span className="text-sm">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedCategoryInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedCategoryInfo.icon}</span>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-300">{selectedCategoryInfo.label}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Recommended budget: ₹5,000 - ₹10,000</p>
              </div>
            </div>
          </motion.div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Monthly Budget Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Alert Threshold: {alertThreshold}%
          </label>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={alerts}
              onChange={(e) => setAlerts(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Enable budget alerts</span>
          </label>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <AlertCircle className="w-3 h-3" />
            You'll be notified when you reach {alertThreshold}%
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createMutation.isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Budget
              </>
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </motion.div>
  )
}

export default BudgetCreator