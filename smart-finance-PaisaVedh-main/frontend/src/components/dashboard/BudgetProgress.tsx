import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'

interface BudgetProgressProps {
  budgets: Array<{
    category: string
    budget: number
    spent: number
    remaining: number
    percentage: number
    status: string
  }>
}

const BudgetProgress: React.FC<BudgetProgressProps> = ({ budgets }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'text-red-500 bg-red-100 dark:bg-red-900/20'
      case 'warning': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20'
      default: return 'text-green-500 bg-green-100 dark:bg-green-900/20'
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-4">
      {budgets.map((budget, index) => (
        <motion.div
          key={budget.category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                {budget.status === 'exceeded' ? 'Exceeded' : budget.status === 'warning' ? 'Warning' : 'On Track'}
              </span>
              <h4 className="font-medium text-gray-900 dark:text-white">{budget.category}</h4>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Budget: {formatCurrency(budget.budget)}</p>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Spent: {formatCurrency(budget.spent)}</span>
              <span className="text-gray-600 dark:text-gray-400">Remaining: {formatCurrency(budget.remaining)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(budget.percentage)}`}
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              {budget.percentage >= 100 ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : budget.percentage >= 80 ? (
                <TrendingDown className="w-4 h-4 text-yellow-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
              <span className="text-xs text-gray-500">{budget.percentage.toFixed(1)}% used</span>
            </div>
            {budget.remaining < 0 && (
              <span className="text-xs text-red-500">Over by {formatCurrency(Math.abs(budget.remaining))}</span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default BudgetProgress