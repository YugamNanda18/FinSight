import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, Clock, Bell } from 'lucide-react'
import { useQuery } from 'react-query'
import { budgetService } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'

interface BudgetAnalyticsProps {
  budgets: any[]
}

const BudgetAnalytics: React.FC<BudgetAnalyticsProps> = ({ budgets }) => {
  const { data: alerts } = useQuery('budget-alerts', () => budgetService.getAlerts().then(res => res.data?.alerts || []), { enabled: false })

  if (!budgets || budgets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No budget data available</p>
        <p className="text-sm text-gray-400 mt-2">Create a budget to see analytics</p>
      </div>
    )
  }

  const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0)
  const totalRemaining = totalBudget - totalSpent
  const overallUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const categoriesAtRisk = budgets.filter(b => b.status === 'warning').length
  const categoriesExceeded = budgets.filter(b => b.status === 'exceeded').length
  const categoriesOnTrack = budgets.filter(b => b.status === 'on_track').length

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'exceeded': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <Clock className="w-5 h-5 text-yellow-500" />
      default: return <CheckCircle className="w-5 h-5 text-green-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Total Budget</p>
          <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Total Spent</p>
          <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-90">Remaining</p>
          <p className="text-2xl font-bold">{formatCurrency(totalRemaining)}</p>
        </div>
        <div className={`rounded-xl p-4 text-white ${overallUtilization > 80 ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-purple-500 to-indigo-500'}`}>
          <p className="text-sm opacity-90">Utilization</p>
          <p className="text-2xl font-bold">{overallUtilization.toFixed(1)}%</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{categoriesOnTrack}</p>
          <p className="text-sm text-green-600">On Track</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-600">{categoriesAtRisk}</p>
          <p className="text-sm text-yellow-600">At Risk</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-600">{categoriesExceeded}</p>
          <p className="text-sm text-red-600">Exceeded</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
          <span className="font-medium">{overallUtilization.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div 
            className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-primary-500 to-secondary-500"
            style={{ width: `${Math.min(overallUtilization, 100)}%` }}
          />
        </div>
      </div>

      {/* Recommendations */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-800 dark:text-purple-400">Smart Recommendations</h3>
        </div>
        <div className="space-y-2">
          {totalRemaining > 0 && totalRemaining < totalBudget * 0.1 && (
            <p className="text-sm text-purple-700 dark:text-purple-500">
              • You're close to your overall budget limit. Consider reducing discretionary spending.
            </p>
          )}
          {categoriesAtRisk > 0 && (
            <p className="text-sm text-purple-700 dark:text-purple-500">
              • {categoriesAtRisk} categories are at risk. Review your spending in these areas.
            </p>
          )}
          {categoriesExceeded > 0 && (
            <p className="text-sm text-purple-700 dark:text-purple-500">
              • {categoriesExceeded} categories have exceeded budget. Create alerts for next month.
            </p>
          )}
          {overallUtilization < 50 && (
            <p className="text-sm text-purple-700 dark:text-purple-500">
              • Great job! You're well within your budget. Consider reallocating surplus to savings.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BudgetAnalytics