import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Calendar, DollarSign, AlertTriangle,
  Lightbulb, Sparkles, ArrowUp, ArrowDown, Shield, Clock,
  Download, RefreshCw, Info, ChevronDown, ChevronUp,
  BarChart3, LineChart as LineChartIcon, PieChart,
  Target, Award, Zap, Brain, Eye, EyeOff
} from 'lucide-react'
import { useQuery, useQueryClient } from 'react-query'
import { analyticsService } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area, AreaChart, ComposedChart, Bar,
  Legend, Scatter
} from 'recharts'
import toast from 'react-hot-toast'

interface ForecastData {
  month: string
  predictedIncome: number
  predictedExpenses: number
  predictedSavings: number
  confidence: number
  trend?: 'up' | 'down' | 'stable'
}

interface ForecastInsight {
  type: 'warning' | 'success' | 'info'
  title: string
  message: string
  action?: string
}

interface SpendingForecastProps {
  timeframe?: 'monthly' | 'quarterly' | 'yearly'
  showControls?: boolean
}

const SpendingForecast: React.FC<SpendingForecastProps> = ({ 
  timeframe = 'monthly', 
  showControls = true 
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>(timeframe)
  const [showDetails, setShowDetails] = useState(false)
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area')
  const queryClient = useQueryClient()

  const { data: forecast, isLoading, error, refetch, isFetching } = useQuery(
    ['cashflow-forecast', selectedTimeframe],
    () => analyticsService.getCashFlow({ timeframe: selectedTimeframe }).then(res => res.data),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      onError: () => {
        toast.error('Failed to load forecast data')
      }
    }
  )

  const handleRefresh = () => {
    refetch()
    toast.success('Refreshing forecast data...')
  }

  const handleExport = () => {
    if (!forecast?.forecast) return
    
    const csvData = forecast.forecast.map((item: any) => ({
      Month: item.month,
      'Predicted Income': item.predictedIncome,
      'Predicted Expenses': item.predictedExpenses,
      'Predicted Savings': item.predictedSavings,
      'Confidence': `${(item.confidence * 100).toFixed(1)}%`
    }))
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forecast_${formatDate(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Forecast exported successfully!')
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <DollarSign className="w-4 h-4 text-gray-500" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-500'
    if (value < 0) return 'text-red-500'
    return 'text-gray-500'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (confidence > 0.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!forecast?.forecast) return null
    
    const totalIncome = forecast.forecast.reduce((sum: number, item: any) => sum + item.predictedIncome, 0)
    const totalExpenses = forecast.forecast.reduce((sum: number, item: any) => sum + item.predictedExpenses, 0)
    const totalSavings = totalIncome - totalExpenses
    const avgConfidence = forecast.forecast.reduce((sum: number, item: any) => sum + item.confidence, 0) / forecast.forecast.length
    
    return { totalIncome, totalExpenses, totalSavings, avgConfidence, periodCount: forecast.forecast.length }
  }, [forecast])

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="text-center py-12">
          <div className="inline-flex p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unable to Load Forecast</h3>
          <p className="text-sm text-gray-500 mb-4">Please try again later</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Spending Forecast</h2>
                <p className="text-white/80 text-sm">AI-powered predictive analysis for future spending</p>
              </div>
            </div>
            
            {showControls && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-white/20 rounded-lg p-1">
                  {['monthly', 'quarterly', 'yearly'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedTimeframe === tf 
                          ? 'bg-white text-blue-600' 
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      {tf.charAt(0).toUpperCase() + tf.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleRefresh}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${isFetching ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleExport}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
                >
                  <Download className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <span className="text-xs text-white/80">Total Forecast Period: {summary.periodCount} months</span>
              </div>
              <div className="px-3 py-1.5 bg-green-500/30 backdrop-blur-sm rounded-lg">
                <span className="text-xs text-white">Projected Savings: {formatCurrency(summary.totalSavings)}</span>
              </div>
              <div className="px-3 py-1.5 bg-blue-500/30 backdrop-blur-sm rounded-lg">
                <span className="text-xs text-white">Avg Confidence: {(summary.avgConfidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Controls */}
      <div className="px-6 pt-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('area')}
            className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <AreaChart className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg transition-all ${chartType === 'line' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <LineChartIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Forecast Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          {chartType === 'area' && (
            <AreaChart data={forecast?.forecast || []}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="#9CA3AF" />
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
              <Area 
                type="monotone" 
                dataKey="predictedIncome" 
                stackId="1" 
                stroke="#10B981" 
                strokeWidth={2}
                fill="url(#incomeGradient)" 
                name="Income"
              />
              <Area 
                type="monotone" 
                dataKey="predictedExpenses" 
                stackId="1" 
                stroke="#EF4444" 
                strokeWidth={2}
                fill="url(#expenseGradient)" 
                name="Expenses"
              />
            </AreaChart>
          )}
          
          {chartType === 'line' && (
            <LineChart data={forecast?.forecast || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="#9CA3AF" />
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
                strokeWidth={3}
                dot={{ r: 5, fill: '#10B981', strokeWidth: 2 }}
                name="Income"
              />
              <Line 
                type="monotone" 
                dataKey="predictedExpenses" 
                stroke="#EF4444" 
                strokeWidth={3}
                dot={{ r: 5, fill: '#EF4444', strokeWidth: 2 }}
                name="Expenses"
              />
              <Line 
                type="monotone" 
                dataKey="predictedSavings" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 5, fill: '#8B5CF6', strokeWidth: 2 }}
                name="Savings"
              />
            </LineChart>
          )}
          
          {chartType === 'bar' && (
            <ComposedChart data={forecast?.forecast || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="#9CA3AF" />
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
              <Bar dataKey="predictedIncome" fill="#10B981" radius={[8, 8, 0, 0]} name="Income" />
              <Bar dataKey="predictedExpenses" fill="#EF4444" radius={[8, 8, 0, 0]} name="Expenses" />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Forecast Cards */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {forecast?.forecast?.map((item: ForecastData, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.month}</h3>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(item.confidence)}`}>
                  {(item.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Income</span>
                  <span className="font-medium text-green-600">{formatCurrency(item.predictedIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expenses</span>
                  <span className="font-medium text-red-600">{formatCurrency(item.predictedExpenses)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-gray-500">Savings</span>
                  <span className={`font-bold flex items-center gap-1 ${getTrendColor(item.predictedSavings)}`}>
                    {getTrendIcon(item.predictedSavings)}
                    {formatCurrency(Math.abs(item.predictedSavings))}
                  </span>
                </div>
              </div>
              
              {item.trend && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Trend</span>
                    <span className={`flex items-center gap-1 ${item.trend === 'up' ? 'text-green-500' : item.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                      {item.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : item.trend === 'down' ? <ArrowDown className="w-3 h-3" /> : null}
                      {item.trend === 'up' ? 'Increasing' : item.trend === 'down' ? 'Decreasing' : 'Stable'}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            {/* Insights Section */}
            {forecast?.insights && forecast.insights.length > 0 && (
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800 dark:text-blue-400">Predictive Insights</h3>
                </div>
                <div className="space-y-2">
                  {forecast.insights.map((insight: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-500">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {forecast?.recommendations && forecast.recommendations.length > 0 && (
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-t border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800 dark:text-green-400">Smart Recommendations</h3>
                </div>
                <div className="space-y-2">
                  {forecast.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-green-700 dark:text-green-500">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {forecast?.riskFactors && forecast.riskFactors.length > 0 && (
              <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-t border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-800 dark:text-red-400">Risk Factors</h3>
                </div>
                <div className="space-y-2">
                  {forecast.riskFactors.map((risk: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-500">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          <span>AI predictions based on historical data and seasonal patterns</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>Last updated: {formatDate(new Date())}</span>
        </div>
      </div>
    </div>
  )
}

export default SpendingForecast