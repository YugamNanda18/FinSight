import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, Calendar, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles, Bell,
  PiggyBank, CreditCard, Target, Shield, Menu, X,
  Download, Filter, ChevronRight, Award, Zap, Globe, Plus
} from 'lucide-react'
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor } from '../utils/formatters'
import { 
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { CHART_COLORS } from '../utils/constants'
import { useTransactionStore } from '../store/transaction.store'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

// Types
interface Transaction {
  _id: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category: string
  merchant: string
  date: string
  notes?: string
  tags?: string[]
}

// Mobile Responsive Stat Card
const StatCard: React.FC<{
  title: string
  value: number
  icon: any
  color: string
  change: string
  isPercentage?: boolean
}> = ({ title, value, icon: Icon, color, change, isPercentage }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6"
  >
    <div className={`absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br ${color} rounded-full blur-2xl opacity-10`} />
    <div className="relative">
      <div className="flex justify-between items-start mb-2 sm:mb-3">
        <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
        <span className={`text-xs sm:text-sm font-semibold ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </span>
      </div>
      <h3 className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
        {isPercentage ? `${value.toFixed(1)}%` : formatCurrency(value)}
      </p>
    </div>
  </motion.div>
)

const TransactionItem: React.FC<{ transaction: Transaction; index: number }> = React.memo(({ transaction, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.03 }}
    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer gap-2 sm:gap-0"
  >
    <div className="flex items-center gap-3">
      <div 
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg"
        style={{ backgroundColor: `${getCategoryColor(transaction.category)}20` }}
      >
        {getCategoryIcon(transaction.category)}
      </div>
      <div>
        <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{transaction.description}</p>
        <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
      </div>
    </div>
    <div className={`font-semibold text-sm sm:text-base ml-11 sm:ml-0 ${transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
    </div>
  </motion.div>
))

TransactionItem.displayName = 'TransactionItem'

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [showNotifications, setShowNotifications] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const navigate = useNavigate()
  
  // Get transactions from store
  const { transactions, fetchTransactions, isLoading } = useTransactionStore()

  useEffect(() => {
    fetchTransactions(1)
  }, [])

  // Calculate dashboard data from actual transactions
  const dashboardData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        savingsRate: 0,
        spendingByCategory: [],
        monthlyTrend: [],
        recentTransactions: [],
        budgetStatus: [],
        aiRecommendations: [
          "🎯 Start by adding your first transaction",
          "📊 Create a budget to track your spending",
          "💰 Set up savings goals for better financial planning"
        ]
      }
    }

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    const currentMonthTransactions = transactions.filter((t: Transaction) => {
      const txDate = new Date(t.date)
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
    })
    
    const monthlyIncome = currentMonthTransactions
      .filter((t: Transaction) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const monthlyExpenses = currentMonthTransactions
      .filter((t: Transaction) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalIncome = transactions
      .filter((t: Transaction) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = transactions
      .filter((t: Transaction) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalBalance = totalIncome - totalExpenses
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
    
    const categoryMap = new Map<string, number>()
    transactions.filter((t: Transaction) => t.type === 'debit').forEach((t: Transaction) => {
      const current = categoryMap.get(t.category) || 0
      categoryMap.set(t.category, current + t.amount)
    })
    
    const spendingByCategory = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthlyTrend = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = date.getMonth()
      const year = date.getFullYear()
      
      const monthTransactions = transactions.filter((t: Transaction) => {
        const txDate = new Date(t.date)
        return txDate.getMonth() === month && txDate.getFullYear() === year
      })
      
      const income = monthTransactions.filter((t: Transaction) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0)
      const expenses = monthTransactions.filter((t: Transaction) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)
      
      monthlyTrend.push({
        month: monthNames[month],
        income,
        expenses
      })
    }
    
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
    
    const aiRecommendations = []
    
    if (transactions.length === 0) {
      aiRecommendations.push("🎯 Start by adding your first transaction")
      aiRecommendations.push("📊 Create a budget to track your spending")
      aiRecommendations.push("💰 Set up savings goals for better financial planning")
    } else {
      if (monthlyExpenses > monthlyIncome * 0.8) {
        aiRecommendations.push("⚠️ Your expenses are above 80% of income. Consider reducing discretionary spending.")
      }
      
      const topCategory = spendingByCategory[0]
      if (topCategory && topCategory.value > monthlyIncome * 0.3) {
        aiRecommendations.push(`📊 Your ${topCategory.name} spending is ${formatCurrency(topCategory.value)}. Try to reduce by 20%.`)
      }
      
      if (savingsRate < 20) {
        aiRecommendations.push("💰 Your savings rate is below 20%. Aim to save at least 20% of your income.")
      }
      
      if (aiRecommendations.length === 0) {
        aiRecommendations.push("🎉 Great job! Your finances are on track. Keep up the good work!")
        aiRecommendations.push("📈 Consider investing your surplus for better returns.")
      }
    }
    
    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      spendingByCategory,
      monthlyTrend,
      recentTransactions,
      aiRecommendations
    }
  }, [transactions])

  const stats = [
    { title: 'Total Balance', value: dashboardData.totalBalance, icon: Wallet, color: 'from-blue-500 to-cyan-500', change: '+12.5%' },
    { title: 'Monthly Income', value: dashboardData.monthlyIncome, icon: TrendingUp, color: 'from-green-500 to-emerald-500', change: '+8.2%' },
    { title: 'Monthly Expenses', value: dashboardData.monthlyExpenses, icon: TrendingDown, color: 'from-red-500 to-pink-500', change: '-3.1%' },
    { title: 'Savings Rate', value: dashboardData.savingsRate, icon: PiggyBank, color: 'from-purple-500 to-indigo-500', change: '+15.3%', isPercentage: true },
  ]

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchTransactions(1)
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success('Dashboard refreshed!')
    }, 500)
  }, [fetchTransactions])

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 sm:h-96">
        <div className="relative">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-gray-500 text-sm sm:text-base animate-pulse">Loading your financial dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-8 sm:pb-0">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header Section - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Track your finances smartly
            </p>
          </div>
          
          <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto justify-between sm:justify-end">
            {/* Time Range Selector - Mobile optimized */}
            <div className="flex gap-0.5 sm:gap-1 bg-white dark:bg-gray-800 rounded-xl p-0.5 sm:p-1 shadow-lg">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg capitalize transition-all duration-200 font-medium text-xs sm:text-sm ${
                    timeRange === range
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            {/* Action Buttons */}
            <button
              onClick={handleRefresh}
              className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Notifications - Hidden on very small screens */}
            <div className="relative hidden xs:block">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all relative"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800 animate-pulse" />
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Notifications</h3>
                    </div>
                    <div className="p-3 sm:p-4 space-y-3 max-h-80 overflow-y-auto">
                      {dashboardData.aiRecommendations.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-1.5 h-1.5 mt-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{rec}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Stats Grid - Mobile Responsive (2 columns on mobile, 4 on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts Section - Stack on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Spending by Category */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Spending by Category</h2>
            {dashboardData.spendingByCategory.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <p className="text-sm">No spending data yet</p>
                <p className="text-xs mt-2">Add expenses to see breakdown</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={dashboardData.spendingByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 0.5 }}
                  >
                    {dashboardData.spendingByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Income vs Expenses Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Income vs Expenses</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dashboardData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(value) => `₹${value/1000}k`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expenses" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Section - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
              <button 
                onClick={() => navigate('/transactions')}
                className="text-xs sm:text-sm text-blue-500 hover:text-blue-600"
              >
                View All →
              </button>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[350px] overflow-y-auto">
              {dashboardData.recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No transactions yet</p>
                  <button 
                    onClick={() => navigate('/transactions')}
                    className="mt-2 text-xs sm:text-sm text-blue-500 hover:text-blue-600"
                  >
                    Add your first transaction →
                  </button>
                </div>
              ) : (
                dashboardData.recentTransactions.map((transaction, index) => (
                  <TransactionItem key={transaction._id || index} transaction={transaction} index={index} />
                ))
              )}
            </div>
          </div>

          {/* Budget Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Budget Status</h2>
            </div>
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Budget feature coming soon</p>
              <button 
                onClick={() => navigate('/budgets')}
                className="mt-2 text-xs sm:text-sm text-blue-500 hover:text-blue-600"
              >
                Create your first budget →
              </button>
            </div>
          </div>

          {/* AI Insights */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -ml-16 -mb-16"></div>
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <h2 className="text-base sm:text-lg font-bold">AI Insights</h2>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {dashboardData.aiRecommendations.slice(0, 4).map((rec, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-2 sm:p-3">
                    <p className="text-xs sm:text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Mobile Responsive */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Quick Actions</h3>
              <p className="text-xs text-gray-500">Manage your finances faster</p>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button 
                onClick={() => navigate('/transactions')}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Add
              </button>
              <button 
                onClick={() => navigate('/budgets')}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all"
              >
                <Target className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" /> Budget
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard