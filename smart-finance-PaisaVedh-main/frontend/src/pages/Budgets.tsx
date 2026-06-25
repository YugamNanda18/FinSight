import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Edit2, Trash2, AlertCircle, Target, TrendingUp, 
  TrendingDown, Wallet, PieChart, Calendar, Filter, 
  Download, ChevronDown, CheckCircle, XCircle,
  Clock, Award, MoreVertical, Search, Sliders, RefreshCw, Grid, List
} from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import { CATEGORIES } from '../utils/constants'
import toast from 'react-hot-toast'
import { useBudgetStore } from '../store/budget.store'
import { useTransactionStore } from '../store/transaction.store'

// Types
interface Budget {
  _id: string
  category: string
  amount: number
  spent: number
  remaining: number
  percentageUsed: number
  status: 'on_track' | 'warning' | 'exceeded'
  createdAt: string
  updatedAt: string
}

interface BudgetStats {
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  averageUtilization: number
  atRiskBudgets: number
  exceededBudgets: number
  onTrackBudgets: number
}

// Budget Card Component
const BudgetCard: React.FC<{
  budget: Budget
  onEdit: (budget: Budget) => void
  onDelete: (id: string) => void
  index: number
  viewMode: 'grid' | 'list'
}> = React.memo(({ budget, onEdit, onDelete, index, viewMode }) => {
  const [showDetails, setShowDetails] = useState(false)
  const isOverBudget = budget.percentageUsed >= 100
  const isWarning = budget.percentageUsed >= 80 && budget.percentageUsed < 100
  
  const getStatusIcon = () => {
    if (isOverBudget) return <XCircle className="w-4 h-4 text-red-500" />
    if (isWarning) return <AlertCircle className="w-4 h-4 text-yellow-500" />
    return <CheckCircle className="w-4 h-4 text-green-500" />
  }

  const getProgressColor = () => {
    if (isOverBudget) return 'from-red-500 to-red-600'
    if (isWarning) return 'from-yellow-500 to-orange-500'
    return 'from-green-500 to-emerald-500'
  }

  const daysRemaining = useMemo(() => {
    const today = new Date()
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return Math.ceil((endOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }, [])

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.01 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 hover:shadow-xl transition-all"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r ${getProgressColor()} shadow-md`}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 dark:text-white">{budget.category}</h3>
                {getStatusIcon()}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>Budget: {formatCurrency(budget.amount)}</span>
                <span>Spent: {formatCurrency(budget.spent)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="text-right">
              <p className={`text-lg font-bold ${isOverBudget ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-green-500'}`}>
                {budget.percentageUsed.toFixed(0)}%
              </p>
              <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                <div className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()}`} style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }} />
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(budget)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                <Edit2 className="w-4 h-4 text-blue-500" />
              </button>
              <button onClick={() => onDelete(budget._id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${getProgressColor()} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10`} />
      
      <div className="relative p-4 sm:p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{budget.category}</h3>
              {getStatusIcon()}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Monthly Budget</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
              isOverBudget ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
              isWarning ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
              'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            }`}>
              {isOverBudget ? 'Exceeded' : isWarning ? 'At Risk' : 'On Track'}
            </div>
            <button onClick={() => setShowDetails(!showDetails)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Utilization</span>
            <span className={`font-bold ${isOverBudget ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-green-500'}`}>
              {budget.percentageUsed.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
              transition={{ duration: 0.8 }}
              className={`absolute h-full rounded-full bg-gradient-to-r ${getProgressColor()}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Budget</p>
            <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{formatCurrency(budget.amount)}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Spent</p>
            <p className="font-bold text-sm sm:text-base text-red-500">{formatCurrency(budget.spent)}</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remaining</p>
            <p className={`font-bold text-sm sm:text-base ${budget.remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(Math.abs(budget.remaining))}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {(isWarning || isOverBudget) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-4 p-3 rounded-xl ${isOverBudget ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}
            >
              <p className={`text-xs sm:text-sm font-medium ${isOverBudget ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                {isOverBudget 
                  ? `Budget exceeded by ${formatCurrency(Math.abs(budget.remaining))}`
                  : `Only ${formatCurrency(budget.remaining)} left for the month`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <button onClick={() => onEdit(budget)} className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all">
            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Edit
          </button>
          <button onClick={() => onDelete(budget._id)} className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all">
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Delete
          </button>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Daily Average</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(budget.spent / 30)}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Days Remaining</span>
                  <span className="font-medium text-gray-900 dark:text-white">{daysRemaining} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Recommended Daily</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {formatCurrency(Math.max(0, budget.remaining / daysRemaining))}/day
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
})

BudgetCard.displayName = 'BudgetCard'

// Stats Overview Component
const StatsOverview: React.FC<{ stats: BudgetStats }> = ({ stats }) => {
  const statCards = [
    { label: 'Total Budget', value: stats.totalBudget, icon: Wallet, color: 'from-blue-500 to-cyan-500', prefix: '$' },
    { label: 'Total Spent', value: stats.totalSpent, icon: TrendingDown, color: 'from-red-500 to-pink-500', prefix: '$' },
    { label: 'Total Remaining', value: stats.totalRemaining, icon: Target, color: 'from-green-500 to-emerald-500', prefix: '$' },
    { label: 'Avg Utilization', value: stats.averageUtilization, icon: PieChart, color: 'from-purple-500 to-indigo-500', suffix: '%' },
    { label: 'On Track', value: stats.onTrackBudgets, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
    { label: 'At Risk', value: stats.atRiskBudgets, icon: AlertCircle, color: 'from-yellow-500 to-orange-500' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {statCards.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4"
        >
          <div className={`absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${stat.color} rounded-full blur-2xl opacity-10`} />
          <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg inline-block`}>
            <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1">{stat.label}</p>
          <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
            {stat.prefix}{typeof stat.value === 'number' ? stat.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : stat.value}{stat.suffix}
          </p>
        </motion.div>
      ))}
    </div>
  )
}

// Main Budgets Component
const Budgets: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'percentage' | 'amount' | 'spent'>('percentage')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [formData, setFormData] = useState({ category: '', amount: '' })
  
  // Use local budget store
  const { budgets, isLoading, addBudget, updateBudget, deleteBudget, fetchBudgets } = useBudgetStore()
  const { transactions } = useTransactionStore()

  useEffect(() => {
    fetchBudgets()
  }, [])

  // Update spent amounts based on transactions
  useEffect(() => {
    if (!budgets.length || !transactions.length) return
    
    // Calculate spent amounts for each budget category
    const categorySpent = new Map<string, number>()
    transactions.filter(t => t.type === 'debit').forEach(t => {
      const current = categorySpent.get(t.category) || 0
      categorySpent.set(t.category, current + t.amount)
    })
    
    // Update budgets with spent amounts
    budgets.forEach(budget => {
      const spent = categorySpent.get(budget.category) || 0
      const remaining = budget.amount - spent
      const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
      
      let status: 'on_track' | 'warning' | 'exceeded' = 'on_track'
      if (percentageUsed >= 100) status = 'exceeded'
      else if (percentageUsed >= 80) status = 'warning'
      
      // Update the budget in store
      if (budget.spent !== spent) {
        // This would need an update method, but for now we'll just use what's in store
      }
    })
  }, [transactions, budgets])

  // Filter and sort budgets
  const filteredBudgets = useMemo(() => {
    if (!budgets || budgets.length === 0) return []
    
    let filtered = [...budgets]
    
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(b => b.category === filterCategory)
    }
    
    filtered.sort((a, b) => {
      if (sortBy === 'percentage') return (b.percentageUsed || 0) - (a.percentageUsed || 0)
      if (sortBy === 'amount') return (b.amount || 0) - (a.amount || 0)
      return (b.spent || 0) - (a.spent || 0)
    })
    
    return filtered
  }, [budgets, filterCategory, searchTerm, sortBy])

  // Calculate stats
  const stats = useMemo(() => {
    if (!budgets || budgets.length === 0) return null
    
    const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0)
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0)
    const totalRemaining = totalBudget - totalSpent
    const averageUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    
    const atRiskBudgets = budgets.filter(b => (b.percentageUsed || 0) >= 80 && (b.percentageUsed || 0) < 100).length
    const exceededBudgets = budgets.filter(b => (b.percentageUsed || 0) >= 100).length
    const onTrackBudgets = budgets.length - atRiskBudgets - exceededBudgets
    
    return { totalBudget, totalSpent, totalRemaining, averageUtilization, atRiskBudgets, exceededBudgets, onTrackBudgets }
  }, [budgets])

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteBudget(id)
    }
  }, [deleteBudget])

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    addBudget({
      category: formData.category,
      amount: parseFloat(formData.amount)
    })
    setFormData({ category: '', amount: '' })
  }

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBudget) return
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    updateBudget(selectedBudget._id, {
      category: formData.category,
      amount: parseFloat(formData.amount)
    })
    setSelectedBudget(null)
    setFormData({ category: '', amount: '' })
  }

  const openEditModal = (budget: Budget) => {
    setSelectedBudget(budget)
    setFormData({
      category: budget.category,
      amount: budget.amount.toString()
    })
  }

  const closeModal = () => {
    setShowAddModal(false)
    setSelectedBudget(null)
    setFormData({ category: '', amount: '' })
  }

  if (isLoading && budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-gray-500 text-sm sm:text-base">Loading your budgets...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-8">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Budgets
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Track and optimize your spending</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" /> : <Grid className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />}
            </button>
            <button
              onClick={() => fetchBudgets()}
              className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> 
              <span>Create Budget</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && <StatsOverview stats={stats} />}

        {/* Search and Filters */}
        <div className="mt-6 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search budgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.EXPENSES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white"
                  >
                    <option value="percentage">Sort by Usage %</option>
                    <option value="amount">Sort by Amount</option>
                    <option value="spent">Sort by Spent</option>
                  </select>
                </div>
                
                {(searchTerm || filterCategory !== 'all') && (
                  <button
                    onClick={() => { setSearchTerm(''); setFilterCategory('all') }}
                    className="text-red-500 text-sm hover:text-red-600"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Budgets Grid/List */}
        <div className="mt-6">
          {!filteredBudgets || filteredBudgets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
            >
              <div className="inline-flex p-3 sm:p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full mb-4">
                <Target className="w-8 h-8 sm:w-12 sm:h-12 text-blue-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">No Budgets Found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto px-4">
                {searchTerm || filterCategory !== 'all' 
                  ? "Try adjusting your search or filters"
                  : "Create your first budget to start tracking your spending"}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold"
              >
                Create Your First Budget
              </button>
            </motion.div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
              : "space-y-3"
            }>
              {filteredBudgets.map((budget, index) => (
                <BudgetCard
                  key={budget._id}
                  budget={budget}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  index={index}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Budget Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-5">
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                >
                  <XCircle className="w-4 h-4 text-white" />
                </button>
                <h2 className="text-xl font-bold text-white">Create New Budget</h2>
                <p className="text-white/80 text-sm mt-1">Set a monthly spending limit</p>
              </div>

              <form onSubmit={handleCreateBudget} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.EXPENSES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Budget Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Create Budget
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Budget Modal */}
        {selectedBudget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-5">
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                >
                  <XCircle className="w-4 h-4 text-white" />
                </button>
                <h2 className="text-xl font-bold text-white">Edit Budget</h2>
                <p className="text-white/80 text-sm mt-1">Update your budget details</p>
              </div>

              <form onSubmit={handleUpdateBudget} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.EXPENSES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Budget Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Update Budget
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Budgets