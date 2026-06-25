import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, FileText, Mail, Calendar, TrendingUp, PieChart, BarChart,
  LineChart, Wallet, ShoppingBag, Coffee, Home, Car, Activity,
  ChevronDown, Filter, Clock, Award, Zap, Share2, Printer,
  Star, TrendingDown, AlertCircle, CheckCircle, DollarSign,
  Percent, RefreshCw, ExternalLink, Save, Eye
} from 'lucide-react'
import { formatCurrency, formatDate } from '../utils/formatters'
import toast from 'react-hot-toast'
import {
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { CHART_COLORS } from '../utils/constants'
import { useTransactionStore } from '../store/transaction.store'
import { useNavigate } from 'react-router-dom'

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
}

interface ReportSummary {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  transactionCount: number
  savingsRate: number
  averageDailySpending: number
  mostActiveCategory: string
  topIncomeSource: string
}

interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  transactions: number
  trend: 'up' | 'down' | 'stable'
}

interface Merchant {
  name: string
  amount: number
  category: string
  transactionCount: number
  averageSpend: number
}

interface DailySpending {
  date: string
  amount: number
  weekday: string
  transactions: number
}

// Custom Components
const StatCard: React.FC<{
  title: string
  value: number
  icon: any
  color: string
  prefix?: string
  suffix?: string
  description?: string
}> = ({ title, value, icon: Icon, color, prefix = '$', suffix = '', description }) => (
  <motion.div
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className={`relative overflow-hidden bg-gradient-to-br ${color} rounded-2xl shadow-xl p-6 text-white group`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <h3 className="text-sm opacity-90 font-medium">{title}</h3>
      <p className="text-2xl font-bold mt-1 tracking-tight">
        {prefix}{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
      </p>
      {description && <p className="text-xs opacity-80 mt-2">{description}</p>}
    </div>
  </motion.div>
)

const CategoryBreakdownChart: React.FC<{ data: CategoryBreakdown[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      name: item.category,
      value: item.amount,
      percentage: item.percentage
    }))
  }, [data])

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No category data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Category Breakdown</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Detailed analysis by spending category</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
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
            </RePieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {data.map((category, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${CHART_COLORS[idx % CHART_COLORS.length]}20` }}>
                    {category.category.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{category.category}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(category.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1 mr-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</span>
                  <span className="text-xs text-gray-400">{category.transactions} txns</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

const TopMerchantsList: React.FC<{ merchants: Merchant[]; title: string; type: 'expense' | 'income' }> = ({ merchants, title, type }) => {
  if (merchants.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          {type === 'expense' ? (
            <ShoppingBag className="w-5 h-5 text-red-500" />
          ) : (
            <TrendingUp className="w-5 h-5 text-green-500" />
          )}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No {type === 'expense' ? 'expense' : 'income'} data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        {type === 'expense' ? (
          <ShoppingBag className="w-5 h-5 text-red-500" />
        ) : (
          <TrendingUp className="w-5 h-5 text-green-500" />
        )}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      
      <div className="space-y-4">
        {merchants.slice(0, 10).map((merchant, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative"
          >
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  #{idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{merchant.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{merchant.category}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{merchant.transactionCount} transactions</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                    {formatCurrency(merchant.amount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">avg {formatCurrency(merchant.averageSpend)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const AIInsights: React.FC<{ insights: string[]; recommendations: string[] }> = ({ insights, recommendations }) => (
  <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-2xl shadow-xl p-6 text-white">
    <div className="flex items-center gap-2 mb-6">
      <Zap className="w-6 h-6" />
      <h2 className="text-xl font-bold">AI-Powered Insights</h2>
      <div className="ml-auto">
        <div className="px-2 py-1 bg-white/20 rounded-lg text-xs font-medium backdrop-blur-sm">
          Real-time Analysis
        </div>
      </div>
    </div>
    
    <div className="space-y-6">
      {/* Key Insights */}
      <div>
        <h3 className="text-sm font-semibold mb-3 opacity-90">Key Insights</h3>
        <div className="space-y-2">
          {insights.slice(0, 3).map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl"
            >
              <div className="w-5 h-5 mt-0.5">
                {insight.includes('increase') ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
              <p className="text-sm flex-1">{insight}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Recommendations */}
      <div>
        <h3 className="text-sm font-semibold mb-3 opacity-90">Smart Recommendations</h3>
        <div className="space-y-2">
          {recommendations.slice(0, 3).map((rec, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-2 p-3 bg-white/10 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-white/20 transition-all"
            >
              <Award className="w-5 h-5 text-yellow-400 mt-0.5" />
              <p className="text-sm flex-1">{rec}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

// Main Component
const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [format, setFormat] = useState<'json' | 'csv'>('csv')
  const [hasGenerated, setHasGenerated] = useState(false)
  const navigate = useNavigate()
  
  // Get transactions from store
  const { transactions, fetchTransactions, isLoading: txLoading } = useTransactionStore()

  useEffect(() => {
    fetchTransactions(1)
  }, [])

  // Generate report from actual transaction data
  const generateReport = useCallback(() => {
    if (!transactions || transactions.length === 0) {
      toast.error('No transactions found. Please add some transactions first.')
      return
    }

    // Filter by date range
    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const filteredTransactions = transactions.filter((t: Transaction) => {
      const txDate = new Date(t.date)
      return txDate >= start && txDate <= end
    })

    if (filteredTransactions.length === 0) {
      toast.error('No transactions found in the selected date range')
      return
    }

    // Calculate summary
    const totalIncome = filteredTransactions
      .filter((t: Transaction) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpenses = filteredTransactions
      .filter((t: Transaction) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const netSavings = totalIncome - totalExpenses
    const transactionCount = filteredTransactions.length
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0
    const averageDailySpending = totalExpenses / 30
    
    // Category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>()
    filteredTransactions.filter((t: Transaction) => t.type === 'debit').forEach((t: Transaction) => {
      const current = categoryMap.get(t.category) || { amount: 0, count: 0 }
      categoryMap.set(t.category, {
        amount: current.amount + t.amount,
        count: current.count + 1
      })
    })
    
    const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        transactions: data.count,
        trend: 'stable' as const
      }))
      .sort((a, b) => b.amount - a.amount)
    
    // Top merchants
    const merchantMap = new Map<string, { amount: number; count: number; category: string }>()
    filteredTransactions.forEach((t: Transaction) => {
      const current = merchantMap.get(t.merchant) || { amount: 0, count: 0, category: t.category }
      merchantMap.set(t.merchant, {
        amount: current.amount + t.amount,
        count: current.count + 1,
        category: t.category
      })
    })
    
    const topMerchants: Merchant[] = Array.from(merchantMap.entries())
      .filter(([_, data]) => data.amount > 0)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        category: data.category,
        transactionCount: data.count,
        averageSpend: data.amount / data.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
    
    const topIncomeSources: Merchant[] = filteredTransactions
      .filter((t: Transaction) => t.type === 'credit')
      .reduce((acc: Merchant[], t: Transaction) => {
        const existing = acc.find(m => m.name === t.merchant)
        if (existing) {
          existing.amount += t.amount
          existing.transactionCount++
          existing.averageSpend = existing.amount / existing.transactionCount
        } else {
          acc.push({
            name: t.merchant,
            amount: t.amount,
            category: t.category,
            transactionCount: 1,
            averageSpend: t.amount
          })
        }
        return acc
      }, [])
      .sort((a, b) => b.amount - a.amount)
    
    // Daily spending
    const dailyMap = new Map<string, { amount: number; count: number }>()
    filteredTransactions.filter((t: Transaction) => t.type === 'debit').forEach((t: Transaction) => {
      const date = formatDate(t.date)
      const current = dailyMap.get(date) || { amount: 0, count: 0 }
      dailyMap.set(date, {
        amount: current.amount + t.amount,
        count: current.count + 1
      })
    })
    
    const dailySpending: DailySpending[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        weekday: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        transactions: data.count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Generate insights
    const insights = []
    if (totalExpenses > totalIncome) {
      insights.push("⚠️ Your expenses exceed your income. Consider reviewing your spending habits.")
    }
    if (savingsRate < 20) {
      insights.push(`📉 Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20%.`)
    }
    if (categoryBreakdown.length > 0 && categoryBreakdown[0].percentage > 30) {
      insights.push(`📊 Your ${categoryBreakdown[0].category} spending is ${categoryBreakdown[0].percentage.toFixed(1)}% of total expenses.`)
    }
    if (insights.length === 0) {
      insights.push("✅ Great job! Your finances are well balanced.")
    }
    
    // Generate recommendations
    const recommendations = []
    if (totalExpenses > totalIncome) {
      recommendations.push("Create a budget to control your spending")
    }
    if (savingsRate < 20) {
      recommendations.push("Set up automatic transfers to a savings account")
    }
    recommendations.push("Review and cancel unused subscriptions")
    recommendations.push("Build an emergency fund covering 6 months of expenses")
    
    const report = {
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        transactionCount,
        savingsRate,
        averageDailySpending,
        mostActiveCategory: categoryBreakdown[0]?.category || 'N/A',
        topIncomeSource: topIncomeSources[0]?.name || 'N/A'
      },
      categoryBreakdown,
      topMerchants,
      topIncomeSources,
      dailySpending,
      insights,
      recommendations
    }
    
    // Store report in localStorage
    localStorage.setItem('lastReport', JSON.stringify({ report, startDate, endDate, date: new Date() }))
    setHasGenerated(true)
    
    // Also save as JSON file
    if (format === 'json') {
      const dataStr = JSON.stringify(report, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `financial-report-${startDate}-to-${endDate}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Report generated and downloaded!')
    } else if (format === 'csv') {
      // Generate CSV
      const headers = ['Date', 'Description', 'Category', 'Merchant', 'Type', 'Amount']
      const csvRows = [headers.join(',')]
      
      filteredTransactions.forEach(t => {
        const row = [
          `"${formatDate(t.date)}"`,
          `"${t.description}"`,
          `"${t.category}"`,
          `"${t.merchant}"`,
          t.type === 'credit' ? 'Income' : 'Expense',
          t.type === 'credit' ? t.amount : -t.amount
        ]
        csvRows.push(row.join(','))
      })
      
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `transactions-${startDate}-to-${endDate}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Report generated and downloaded!')
    }
    
    toast.success('Report generated successfully!')
  }, [transactions, startDate, endDate, format])

  const handleExport = () => {
    if (!hasGenerated) {
      toast.error('Please generate a report first')
      return
    }
    generateReport()
  }

  const handleSendEmail = () => {
    const email = prompt('Enter email address to send the report:')
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.success(`Demo: Report would be sent to ${email}`)
      toast.info('Email functionality requires backend configuration')
    } else if (email) {
      toast.error('Please enter a valid email address')
    }
  }

  // Get the generated report from localStorage
  const savedReport = localStorage.getItem('lastReport')
  const report = savedReport ? JSON.parse(savedReport) : null

  if (txLoading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-gray-500 animate-pulse">Loading your transactions...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                Financial Reports
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 dark:text-gray-400"
            >
              Generate reports from your transaction data
            </motion.p>
          </div>
        </div>

        {/* Report Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Download className="w-4 h-4 inline mr-1" />
                Export Format
              </label>
              <div className="relative">
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="csv">CSV (Spreadsheet)</option>
                  <option value="json">JSON (Data)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={generateReport}
                className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Generate & Download Report
              </button>
            </div>
          </div>
        </motion.div>

        {/* Report Results */}
        {report && hasGenerated && report.report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Income"
                value={report.report.summary.totalIncome}
                icon={TrendingUp}
                color="from-green-500 to-emerald-500"
                description={`${report.report.summary.topIncomeSource} is top source`}
              />
              <StatCard
                title="Total Expenses"
                value={report.report.summary.totalExpenses}
                icon={ShoppingBag}
                color="from-red-500 to-pink-500"
                description={`${report.report.summary.mostActiveCategory} is highest`}
              />
              <StatCard
                title="Net Savings"
                value={report.report.summary.netSavings}
                icon={Wallet}
                color="from-purple-500 to-indigo-500"
                description={`${report.report.summary.savingsRate.toFixed(1)}% savings rate`}
              />
              <StatCard
                title="Transactions"
                value={report.report.summary.transactionCount}
                icon={Activity}
                color="from-blue-500 to-cyan-500"
                prefix=""
                description={`${report.report.dailySpending.length} days`}
              />
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-6">
              <CategoryBreakdownChart data={report.report.categoryBreakdown} />
              <TopMerchantsList merchants={report.report.topMerchants} title="Top Spending" type="expense" />
            </div>

            {/* Income Sources */}
            <TopMerchantsList merchants={report.report.topIncomeSources} title="Top Income Sources" type="income" />

            {/* AI Insights */}
            <div className="grid lg:grid-cols-1 gap-6">
              <AIInsights insights={report.report.insights} recommendations={report.report.recommendations} />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Share via Email
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!hasGenerated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
          >
            <div className="inline-flex p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full mb-4">
              <FileText className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Report Generated</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Select your date range and format, then click "Generate & Download Report"
            </p>
            {transactions.length === 0 && (
              <div className="mt-4">
                <p className="text-sm text-yellow-600 mb-2">No transactions found!</p>
                <button
                  onClick={() => navigate('/transactions')}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  Add Your First Transaction
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Reports