import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Target, TrendingUp, Calendar, Gift, PiggyBank, 
  Clock, Award, Zap, AlertCircle, CheckCircle, XCircle,
  ArrowUp, ArrowDown, Download, Share2, Filter, Search,
  BarChart3, Wallet, CreditCard, Rocket, Star, Flame,
  Bell, Settings, MoreVertical, Edit2, Trash2, Eye,
  RefreshCw  // ← Added missing import
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { savingsService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { CHART_COLORS } from '../utils/constants'

// Types
interface SavingsGoal {
  _id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'completed' | 'behind'
  contributions: Array<{
    amount: number
    date: string
    description: string
  }>
  monthlyRecommended?: number
  progress?: number
  daysRemaining?: number
  projectedCompletion?: string
}

// Custom Components
const GoalCard: React.FC<{
  goal: SavingsGoal
  index: number
  onContribute: (goal: SavingsGoal) => void
  onEdit: (goal: SavingsGoal) => void
  onDelete: (id: string) => void
  onViewDetails: (goal: SavingsGoal) => void
}> = ({ goal, index, onContribute, onEdit, onDelete, onViewDetails }) => {
  const [showDetails, setShowDetails] = useState(false)
  const progress = (goal.currentAmount / goal.targetAmount) * 100
  const isCompleted = progress >= 100
  const isBehind = goal.status === 'behind'
  
  const getPriorityColor = () => {
    switch (goal.priority) {
      case 'high': return 'from-red-500 to-red-600'
      case 'medium': return 'from-yellow-500 to-orange-500'
      default: return 'from-green-500 to-emerald-500'
    }
  }

  const getPriorityIcon = () => {
    switch (goal.priority) {
      case 'high': return <Flame className="w-3 h-3" />
      case 'medium': return <Clock className="w-3 h-3" />
      default: return <Zap className="w-3 h-3" />
    }
  }

  const daysRemaining = useMemo(() => {
    return Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
  }, [goal.targetDate])

  const monthlyNeeded = useMemo(() => {
    const remaining = goal.targetAmount - goal.currentAmount
    const monthsRemaining = daysRemaining / 30
    return monthsRemaining > 0 ? remaining / monthsRemaining : 0
  }, [goal, daysRemaining])

  const getRecommendation = () => {
    if (isCompleted) return "Congratulations! Goal achieved! 🎉"
    if (monthlyNeeded > (goal.monthlyRecommended || 0) * 1.5) {
      return "⚠️ Increase savings to stay on track"
    }
    if (progress >= 75) return "🎯 Almost there! Keep pushing!"
    if (progress >= 50) return "💪 Making good progress!"
    return "🚀 Start saving more to reach your goal"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getPriorityColor()} rounded-full blur-2xl opacity-10`} />
      
      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${getPriorityColor()} shadow-lg`}>
              <PiggyBank className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${getPriorityColor()} text-white`}>
                  {getPriorityIcon()}
                  {goal.priority}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Created on {formatDate(goal.contributions[0]?.date || new Date())}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
              isCompleted ? 'bg-green-100 text-green-700' :
              isBehind ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {isCompleted ? 'Completed' : isBehind ? 'Behind' : 'Active'}
            </div>
            <button onClick={() => setShowDetails(!showDetails)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between text-xs sm:text-sm mb-2">
            <span className="text-gray-500">Progress</span>
            <span className={`font-bold ${progress >= 100 ? 'text-green-500' : progress >= 75 ? 'text-blue-500' : 'text-gray-700'}`}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8 }}
              className={`absolute h-full rounded-full bg-gradient-to-r ${getPriorityColor()}`}
            />
            {progress >= 100 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Target</p>
            <p className="font-bold text-sm sm:text-base">{formatCurrency(goal.targetAmount)}</p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Saved</p>
            <p className="font-bold text-sm sm:text-base text-green-500">{formatCurrency(goal.currentAmount)}</p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Remaining</p>
            <p className="font-bold text-sm sm:text-base text-orange-500">{formatCurrency(goal.targetAmount - goal.currentAmount)}</p>
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Days Left</p>
            <p className="font-bold text-sm sm:text-base">{daysRemaining} days</p>
          </div>
        </div>

        {/* Monthly Recommendation */}
        {!isCompleted && (
          <div className={`mb-4 p-3 rounded-xl ${monthlyNeeded > (goal.monthlyRecommended || 0) ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-gray-600">Monthly Needed</span>
              <span className="font-bold text-purple-600">{formatCurrency(monthlyNeeded)}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {getPriorityIcon()}
              <p className="text-xs text-gray-600 flex-1">{getRecommendation()}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isCompleted && (
            <button
              onClick={() => onContribute(goal)}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all"
            >
              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Add Money
            </button>
          )}
          <button
            onClick={() => onViewDetails(goal)}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Details
          </button>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Target Date</span>
                  <span className="font-medium">{formatDate(goal.targetDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Projected Completion</span>
                  <span className="font-medium text-green-600">
                    {goal.projectedCompletion || formatDate(new Date(Date.now() + daysRemaining * 86400000))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Contributions</span>
                  <span className="font-medium">{goal.contributions?.length || 0} transactions</span>
                </div>
                
                {/* Recent Contributions */}
                {goal.contributions && goal.contributions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Recent Contributions</p>
                    <div className="space-y-1">
                      {goal.contributions.slice(-3).reverse().map((contribution, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span>{formatDate(contribution.date)}</span>
                          <span className="text-green-500">+{formatCurrency(contribution.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <button onClick={() => onEdit(goal)} className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                    <Edit2 className="w-3 h-3 inline mr-1" /> Edit
                  </button>
                  <button onClick={() => onDelete(goal._id)} className="flex-1 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium">
                    <Trash2 className="w-3 h-3 inline mr-1" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Contribution Modal Component
const ContributionModal: React.FC<{
  isOpen: boolean
  goal: SavingsGoal | null
  onClose: () => void
  onContribute: (amount: number, description: string) => void
}> = ({ isOpen, goal, onClose, onContribute }) => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  if (!isOpen || !goal) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    onContribute(numAmount, description || 'Manual contribution')
    setAmount('')
    setDescription('')
  }

  const suggestedAmounts = [500, 1000, 2500, 5000]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-6">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-white/20 rounded-lg">
            <XCircle className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Contribution</h2>
              <p className="text-white/80 text-sm">For: {goal.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Suggested Amounts</label>
            <div className="flex flex-wrap gap-2">
              {suggestedAmounts.map(suggested => (
                <button
                  key={suggested}
                  type="button"
                  onClick={() => setAmount(suggested.toString())}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                >
                  ${suggested.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Monthly savings, Bonus, Gift"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Add Contribution
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// Goal Details Modal
const GoalDetailsModal: React.FC<{
  isOpen: boolean
  goal: SavingsGoal | null
  onClose: () => void
}> = ({ isOpen, goal, onClose }) => {
  if (!isOpen || !goal) return null

  const progress = (goal.currentAmount / goal.targetAmount) * 100
  const daysRemaining = Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
  
  // Chart data
  const chartData = goal.contributions?.map(cont => ({
    date: formatDate(cont.date),
    amount: cont.amount,
    cumulative: 0
  })) || []

  let cumulative = 0
  chartData.forEach(item => {
    cumulative += item.amount
    item.cumulative = cumulative
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-white/20 rounded-lg">
            <XCircle className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{goal.name}</h2>
              <p className="text-white/80 text-sm">Goal Details & Analytics</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Overview */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-4xl font-bold">
              {Math.round(progress)}%
            </div>
            <p className="mt-3 text-gray-600">Overall Progress</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-sm text-gray-500">Target Amount</p>
              <p className="text-xl font-bold">{formatCurrency(goal.targetAmount)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-sm text-gray-500">Current Savings</p>
              <p className="text-xl font-bold text-green-500">{formatCurrency(goal.currentAmount)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-xl font-bold text-orange-500">{formatCurrency(goal.targetAmount - goal.currentAmount)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-sm text-gray-500">Days Remaining</p>
              <p className="text-xl font-bold">{daysRemaining}</p>
            </div>
          </div>

          {/* Progress Chart */}
          {chartData.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Progress Over Time</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="cumulative" stroke="#3B82F6" fill="url(#progressGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Contribution History */}
          {goal.contributions && goal.contributions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Contribution History</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {goal.contributions.slice().reverse().map((contribution, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{contribution.description || 'Contribution'}</p>
                      <p className="text-xs text-gray-500">{formatDate(contribution.date)}</p>
                    </div>
                    <p className="font-bold text-green-500">+{formatCurrency(contribution.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// Main Component
const Savings: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const queryClient = useQueryClient()

  const { data: goals, isLoading, refetch } = useQuery(
    'savings-goals',
    () => savingsService.getAll().then(res => res.data.data),
    { staleTime: 30000 }
  )

  const createMutation = useMutation(savingsService.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('savings-goals')
      setShowAddModal(false)
      toast.success('Goal created successfully! 🎯')
    },
    onError: () => toast.error('Failed to create goal')
  })

  const contributeMutation = useMutation(
    ({ id, data }: any) => savingsService.addContribution(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('savings-goals')
        setShowContributeModal(false)
        setSelectedGoal(null)
        toast.success('Contribution added successfully! 💰')
      },
      onError: () => toast.error('Failed to add contribution')
    }
  )

  const deleteMutation = useMutation(savingsService.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('savings-goals')
      toast.success('Goal deleted successfully')
    },
    onError: () => toast.error('Failed to delete goal')
  })

  const filteredGoals = useMemo(() => {
    if (!goals) return []
    
    let filtered = [...goals]
    
    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(g => g.priority === filterPriority)
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(g => {
        if (filterStatus === 'completed') return g.currentAmount >= g.targetAmount
        if (filterStatus === 'active') return g.currentAmount < g.targetAmount && g.status !== 'behind'
        if (filterStatus === 'behind') return g.status === 'behind'
        return true
      })
    }
    
    return filtered
  }, [goals, searchTerm, filterPriority, filterStatus])

  const stats = useMemo(() => {
    if (!goals) return null
    
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
    const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length
    const activeGoals = goals.length - completedGoals
    
    return { totalTarget, totalSaved, completedGoals, activeGoals, totalProgress: (totalSaved / totalTarget) * 100 }
  }, [goals])

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      deleteMutation.mutate(id)
    }
  }, [deleteMutation])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-gray-500">Loading your savings goals...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-8">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Savings Goals
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">Track and achieve your financial targets</p>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> 
            <span>New Goal</span>
          </button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4">
              <p className="text-xs text-gray-500">Total Target</p>
              <p className="text-lg sm:text-xl font-bold">{formatCurrency(stats.totalTarget)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4">
              <p className="text-xs text-gray-500">Total Saved</p>
              <p className="text-lg sm:text-xl font-bold text-green-500">{formatCurrency(stats.totalSaved)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4">
              <p className="text-xs text-gray-500">Active Goals</p>
              <p className="text-lg sm:text-xl font-bold text-blue-500">{stats.activeGoals}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-lg sm:text-xl font-bold text-green-500">{stats.completedGoals}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search goals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="behind">Behind</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </button>
              <button onClick={() => refetch()} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Goals Grid/List */}
        {filteredGoals.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
            <div className="inline-flex p-3 sm:p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
              <PiggyBank className="w-8 h-8 sm:w-12 sm:h-12 text-green-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Savings Goals Found</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto px-4">
              {searchTerm || filterPriority !== 'all' || filterStatus !== 'all'
                ? "Try adjusting your search or filters"
                : "Create your first savings goal to start building wealth"}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
            : "space-y-3"
          }>
            {filteredGoals.map((goal, index) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                index={index}
                onContribute={(g) => { setSelectedGoal(g); setShowContributeModal(true) }}
                onEdit={(g) => { setSelectedGoal(g); setShowAddModal(true) }}
                onDelete={handleDelete}
                onViewDetails={(g) => { setSelectedGoal(g); setShowDetailsModal(true) }}
              />
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => { setShowAddModal(false); setSelectedGoal(null) }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-6">
                <button
                  onClick={() => { setShowAddModal(false); setSelectedGoal(null) }}
                  className="absolute top-3 right-3 p-1.5 bg-white/20 rounded-lg"
                >
                  <XCircle className="w-4 h-4 text-white" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedGoal ? 'Edit Goal' : 'Create New Goal'}
                    </h2>
                    <p className="text-white/80 text-sm">
                      {selectedGoal ? 'Update your savings goal' : 'Set a new financial target'}
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const data = {
                    name: formData.get('name'),
                    targetAmount: parseFloat(formData.get('targetAmount') as string),
                    targetDate: formData.get('targetDate'),
                    priority: formData.get('priority'),
                  }
                  createMutation.mutate(data)
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold mb-2">Goal Name *</label>
                  <input
                    name="name"
                    defaultValue={selectedGoal?.name || ''}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Emergency Fund, Vacation, House"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Target Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="targetAmount"
                      defaultValue={selectedGoal?.targetAmount || ''}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Target Date *</label>
                  <input
                    type="date"
                    name="targetDate"
                    defaultValue={selectedGoal?.targetDate?.split('T')[0] || ''}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Priority</label>
                  <select
                    name="priority"
                    defaultValue={selectedGoal?.priority || 'medium'}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
                  >
                    <option value="high">🔥 High Priority</option>
                    <option value="medium">⚡ Medium Priority</option>
                    <option value="low">💚 Low Priority</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={createMutation.isLoading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold"
                  >
                    {createMutation.isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      selectedGoal ? 'Update Goal' : 'Create Goal'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setSelectedGoal(null) }}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Contribution Modal */}
        <ContributionModal
          isOpen={showContributeModal}
          goal={selectedGoal}
          onClose={() => { setShowContributeModal(false); setSelectedGoal(null) }}
          onContribute={(amount, description) => {
            if (selectedGoal) {
              contributeMutation.mutate({ id: selectedGoal._id, data: { amount, description } })
            }
          }}
        />

        {/* Goal Details Modal */}
        <GoalDetailsModal
          isOpen={showDetailsModal}
          goal={selectedGoal}
          onClose={() => { setShowDetailsModal(false); setSelectedGoal(null) }}
        />
      </div>
    </div>
  )
}

export default Savings