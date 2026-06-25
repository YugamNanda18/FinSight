import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Calendar, Download, Brain, 
  PieChart as PieChartIcon, BarChart3, Activity, Zap,
  AlertCircle, Target, Sparkles, Shield, Clock, DollarSign,
  Percent, ArrowUpRight, ArrowDownRight, Eye, RefreshCw,
  Filter, Maximize2, Minimize2, Info, Award, Star
} from 'lucide-react'
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor } from '../utils/formatters'
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, Area, AreaChart, RadialBarChart, 
  RadialBar, ComposedChart, Scatter 
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
}

interface CategoryTrend {
  category: string
  amount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  change: number
}

interface AIInsight {
  type: 'warning' | 'success' | 'info' | 'tip'
  title: string
  message: string
  action?: string
  impact?: number
}

interface Forecast {
  month: string
  predictedIncome: number
  predictedExpenses: number
  predictedSavings: number
  confidence: number
}

// Custom Components
const MetricCard: React.FC<{
  title: string
  value: string | number
  icon: any
  trend?: number
  color: string
  description?: string
}> = ({ title, value, icon: Icon, trend, color, description }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className={`relative overflow-hidden bg-gradient-to-br ${color} rounded-2xl shadow-xl p-6 text-white group cursor-pointer`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trend >= 0 ? 'bg-green-500/30' : 'bg-red-500/30'} backdrop-blur-sm`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium opacity-90">{title}</h3>
      <p className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight">{value}</p>
      {description && <p className="text-xs opacity-80 mt-2">{description}</p>}
    </div>
  </motion.div>
)

const AIInsightCard: React.FC<{ insight: AIInsight; index: number }> = ({ insight, index }) => {
  const getTypeStyles = () => {
    switch (insight.type) {
      case 'warning':
        return 'from-yellow-500 to-orange-500 border-yellow-500/20'
      case 'success':
        return 'from-green-500 to-emerald-500 border-green-500/20'
      case 'tip':
        return 'from-blue-500 to-cyan-500 border-blue-500/20'
      default:
        return 'from-purple-500 to-pink-500 border-purple-500/20'
    }
  }

  const getTypeIcon = () => {
    switch (insight.type) {
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'success': return <Award className="w-5 h-5 text-green-500" />
      case 'tip': return <Sparkles className="w-5 h-5 text-blue-500" />
      default: return <Brain className="w-5 h-5 text-purple-500" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative overflow-hidden bg-gradient-to-br ${getTypeStyles()} rounded-xl p-5 shadow-lg group cursor-pointer`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
      
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
            {getTypeIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm sm:text-base">{insight.title}</h3>
            <p className="text-xs sm:text-sm text-white/90 mt-1">{insight.message}</p>
            
            {insight.impact && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-white/80">
                  <TrendingUp className="w-3 h-3" />
                  <span>Potential impact: </span>
                  <span className="font-semibold text-yellow-300">
                    {formatCurrency(insight.impact)}
                  </span>
                </div>
              </div>
            )}
            
            {insight.action && (
              <button className="mt-3 text-xs font-semibold text-white/90 hover:text-white transition-colors flex items-center gap-1">
                {insight.action} →
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const FinancialHealthScore: React.FC<{ score: number }> = ({ score }) => {
  const getScoreColor = () => {
    if (score >= 80) return '#10B981'
    if (score >= 60) return '#F59E0B'
    return '#EF4444'
  }

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-purple-500" />
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Financial Health Score</h2>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              data={[{ name: 'Health Score', value: score, fill: getScoreColor() }]}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                minAngle={15}
                background
                clockWise
                dataKey="value"
                cornerRadius={10}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl sm:text-3xl font-bold fill-current text-gray-900 dark:text-white"
              >
                {score}
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-center">
          <p className={`text-lg sm:text-xl font-bold`} style={{ color: getScoreColor() }}>
            {getScoreLabel()}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Based on your savings rate and spending patterns
          </p>
        </div>
      </div>
    </div>
  )
}

// Main Analytics Component
const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const navigate = useNavigate()
  
  // Get transactions from store
  const { transactions, fetchTransactions, isLoading } = useTransactionStore()

  useEffect(() => {
    fetchTransactions(1)
  }, [])

  // Calculate analytics from actual transaction data
  const analyticsData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        patterns: [],
        topCategories: [],
        categoryDistribution: [],
        forecast: [],
        insights: [],
        summary: {
          averageMonthlySpend: 0,
          highestSpendingMonth: 'N/A',
          bestSavingMonth: 'N/A',
          spendingGrowth: 0,
          savingsGrowth: 0,
          financialHealth: 50
        }
      }
    }

    // Calculate current date info
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    // Get last 6 months for trend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const patterns = []
    
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
      const savings = income - expenses
      
      patterns.push({
        month: monthNames[month],
        income,
        expenses,
        savings,
        savingsRate: income > 0 ? (savings / income) * 100 : 0
      })
    }
    
    // Calculate spending by category
    const categoryMap = new Map<string, number>()
    transactions.filter((t: Transaction) => t.type === 'debit').forEach((t: Transaction) => {
      const current = categoryMap.get(t.category) || 0
      categoryMap.set(t.category, current + t.amount)
    })
    
    const totalSpent = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0)
    
    const topCategories: CategoryTrend[] = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        trend: 'stable' as const,
        change: 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
    
    const categoryDistribution = topCategories.map(cat => ({
      name: cat.category,
      value: cat.amount
    }))
    
    // Calculate summary stats
    const currentMonthTransactions = transactions.filter((t: Transaction) => {
      const txDate = new Date(t.date)
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
    })
    
    const currentMonthIncome = currentMonthTransactions.filter((t: Transaction) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0)
    const currentMonthExpenses = currentMonthTransactions.filter((t: Transaction) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)
    const currentMonthSavings = currentMonthIncome - currentMonthExpenses
    const savingsRate = currentMonthIncome > 0 ? (currentMonthSavings / currentMonthIncome) * 100 : 0
    
    // Calculate financial health score
    let financialHealth = 50 // Base score
    
    // Add points based on savings rate
    if (savingsRate >= 30) financialHealth += 30
    else if (savingsRate >= 20) financialHealth += 20
    else if (savingsRate >= 10) financialHealth += 10
    
    // Add points for having transactions
    if (transactions.length > 10) financialHealth += 10
    else if (transactions.length > 5) financialHealth += 5
    
    // Subtract if expenses exceed income
    if (currentMonthExpenses > currentMonthIncome) financialHealth -= 15
    
    financialHealth = Math.min(100, Math.max(0, financialHealth))
    
    // Generate AI Insights based on actual data
    const insights: AIInsight[] = []
    
    if (transactions.length === 0) {
      insights.push({
        type: 'tip',
        title: 'Start Tracking',
        message: 'Add your first transaction to get personalized insights about your spending habits.',
        action: 'Add Transaction'
      })
    } else {
      if (savingsRate < 20) {
        insights.push({
          type: 'warning',
          title: 'Low Savings Rate',
          message: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim to save at least 20% of your income.`,
          impact: currentMonthIncome * 0.2,
          action: 'Set Savings Goal'
        })
      } else {
        insights.push({
          type: 'success',
          title: 'Great Savings!',
          message: `You're saving ${savingsRate.toFixed(1)}% of your income. Keep up the good work!`,
          action: 'View Goals'
        })
      }
      
      const highestCategory = topCategories[0]
      if (highestCategory && highestCategory.percentage > 30) {
        insights.push({
          type: 'tip',
          title: 'High Spending Alert',
          message: `Your ${highestCategory.category} spending is ${highestCategory.percentage.toFixed(1)}% of total expenses. Consider reviewing this category.`,
          impact: highestCategory.amount * 0.2,
          action: 'Review Spending'
        })
      }
      
      if (currentMonthExpenses > currentMonthIncome) {
        insights.push({
          type: 'warning',
          title: 'Expenses Exceed Income',
          message: 'Your expenses are higher than your income this month. Review your spending to avoid debt.',
          action: 'Create Budget'
        })
      }
    }
    
    // Generate simple forecast
    const forecast: Forecast[] = []
    const avgIncome = patterns.reduce((sum, p) => sum + p.income, 0) / (patterns.length || 1)
    const avgExpenses = patterns.reduce((sum, p) => sum + p.expenses, 0) / (patterns.length || 1)
    
    for (let i = 1; i <= 6; i++) {
      const nextDate = new Date()
      nextDate.setMonth(nextDate.getMonth() + i)
      forecast.push({
        month: monthNames[nextDate.getMonth()],
        predictedIncome: avgIncome * (1 + (Math.random() * 0.1 - 0.05)),
        predictedExpenses: avgExpenses * (1 + (Math.random() * 0.1 - 0.05)),
        predictedSavings: avgIncome - avgExpenses,
        confidence: 0.85 - (i * 0.05)
      })
    }
    
    return {
      patterns,
      topCategories,
      categoryDistribution,
      forecast,
      insights,
      summary: {
        averageMonthlySpend: patterns.reduce((sum, p) => sum + p.expenses, 0) / (patterns.length || 1),
        highestSpendingMonth: patterns.reduce((max, p) => p.expenses > max.expenses ? p : max, patterns[0])?.month || 'N/A',
        bestSavingMonth: patterns.reduce((max, p) => p.savings > max.savings ? p : max, patterns[0])?.month || 'N/A',
        spendingGrowth: patterns.length >= 2 ? ((patterns[patterns.length-1].expenses - patterns[0].expenses) / (patterns[0].expenses || 1)) * 100 : 0,
        savingsGrowth: patterns.length >= 2 ? ((patterns[patterns.length-1].savings - patterns[0].savings) / (Math.abs(patterns[0].savings) || 1)) * 100 : 0,
        financialHealth
      }
    }
  }, [transactions])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchTransactions(1)
    setTimeout(() => {
      setIsRefreshing(false)
      toast.success('Analytics refreshed!')
    }, 500)
  }, [fetchTransactions])

  if (isLoading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 sm:h-96">
        <div className="relative">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-gray-500 text-sm sm:text-base animate-pulse">Analyzing your financial patterns...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-8">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Financial Analytics
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Deep insights and analysis of your financial behavior
            </p>
          </div>
          
          <div className="flex gap-2 sm:gap-3">
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
            
            <button
              onClick={handleRefresh}
              className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Key Metrics - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title="Average Monthly Spend"
            value={formatCurrency(analyticsData.summary.averageMonthlySpend)}
            icon={DollarSign}
            trend={-analyticsData.summary.spendingGrowth}
            color="from-blue-500 to-cyan-500"
            description="vs previous period"
          />
          <MetricCard
            title="Savings Rate"
            value={`${analyticsData.patterns.length > 0 ? analyticsData.patterns[analyticsData.patterns.length - 1]?.savingsRate.toFixed(1) || 0 : 0}%`}
            icon={Percent}
            trend={analyticsData.summary.savingsGrowth}
            color="from-green-500 to-emerald-500"
            description="current month"
          />
          <MetricCard
            title="Best Saving Month"
            value={analyticsData.summary.bestSavingMonth}
            icon={Award}
            color="from-purple-500 to-indigo-500"
            description="highest savings"
          />
          <MetricCard
            title="Financial Health"
            value={`${Math.round(analyticsData.summary.financialHealth)}`}
            icon={Shield}
            color="from-orange-500 to-red-500"
            description="out of 100"
          />
        </div>

        {/* Spending Patterns Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Spending Patterns</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Income vs expenses trend analysis</p>
            </div>
            <div className="flex gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Expenses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Savings</span>
              </div>
            </div>
          </div>
          
          {analyticsData.patterns.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm text-gray-500">No transaction data available</p>
              <button 
                onClick={() => navigate('/transactions')}
                className="mt-3 text-xs sm:text-sm text-blue-500 hover:text-blue-600"
              >
                Add your first transaction →
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.patterns}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fill="url(#incomeGradient)" />
                <Area type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} fill="url(#expenseGradient)" />
                <Area type="monotone" dataKey="savings" stroke="#8B5CF6" strokeWidth={2} fill="url(#savingsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Top Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Top Spending Categories</h2>
            </div>
            
            {analyticsData.topCategories.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm text-gray-500">No spending data available</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.topCategories} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis type="category" dataKey="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="amount" fill="#3B82F6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-4 space-y-2">
                  {analyticsData.topCategories.slice(0, 3).map((category, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{category.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Category Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <PieChartIcon className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Category Distribution</h2>
            </div>
            
            {analyticsData.categoryDistribution.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm text-gray-500">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 0.5 }}
                  >
                    {analyticsData.categoryDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="white"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">AI-Powered Insights</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {analyticsData.insights.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-500">Add transactions to see insights</p>
                </div>
              ) : (
                analyticsData.insights.map((insight, idx) => (
                  <AIInsightCard key={idx} insight={insight} index={idx} />
                ))
              )}
            </div>
          </div>
          
          <div>
            <FinancialHealthScore score={analyticsData.summary.financialHealth} />
          </div>
        </div>

        {/* Cash Flow Forecast */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Cash Flow Forecast</h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Predictive analysis for next 6 months</p>
            </div>
            <div className="flex gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Expenses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Savings</span>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="#9CA3AF" tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="predictedIncome" 
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={{ r: 4, fill: '#10B981', strokeWidth: 1 }}
              />
              <Line 
                type="monotone" 
                dataKey="predictedExpenses" 
                stroke="#EF4444" 
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={{ r: 4, fill: '#EF4444', strokeWidth: 1 }}
              />
              <Line 
                type="monotone" 
                dataKey="predictedSavings" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="mt-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-400">Forecast Information</p>
                <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
                  Based on your historical transaction data. Add more transactions for better predictions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button 
            onClick={() => navigate('/transactions')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Target className="w-4 h-4" />
            Add Transactions
          </button>
          <button 
            onClick={() => navigate('/budgets')}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Target className="w-4 h-4" />
            Create Budget
          </button>
        </div>
      </div>
    </div>
  )
}

export default Analytics