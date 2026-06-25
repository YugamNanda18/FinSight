import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, TrendingUp, TrendingDown, DollarSign, 
  Activity, BarChart3, Zap, Award, Clock, 
  Maximize2, Minimize2, Info, Download, Filter
} from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { ResponsiveContainer, Tooltip, Cell, PieChart, Pie } from 'recharts'
import { X } from 'lucide-react'  // Add this to existing imports

interface ExpenseHeatmapProps {
  data: Array<{
    day: string
    amount: number
    count: number
    average?: number
    trend?: 'up' | 'down' | 'stable'
  }>
  title?: string
  viewMode?: 'grid' | 'compact'
  onDayClick?: (day: string) => void
}

const ExpenseHeatmap: React.FC<ExpenseHeatmapProps> = ({ 
  data, 
  title = "Expense Heatmap", 
  viewMode: initialViewMode = 'grid',
  onDayClick 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>(initialViewMode)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(false)

  const getIntensity = (amount: number, maxAmount: number) => {
    const intensity = (amount / maxAmount) * 100
    if (intensity < 20) return {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      icon: '🟢'
    }
    if (intensity < 40) return {
      bg: 'bg-green-200 dark:bg-green-800/40',
      text: 'text-green-800 dark:text-green-200',
      border: 'border-green-300 dark:border-green-700',
      icon: '✅'
    }
    if (intensity < 60) return {
      bg: 'bg-yellow-200 dark:bg-yellow-800/40',
      text: 'text-yellow-800 dark:text-yellow-200',
      border: 'border-yellow-300 dark:border-yellow-700',
      icon: '⚠️'
    }
    if (intensity < 80) return {
      bg: 'bg-orange-200 dark:bg-orange-800/40',
      text: 'text-orange-800 dark:text-orange-200',
      border: 'border-orange-300 dark:border-orange-700',
      icon: '🔥'
    }
    return {
      bg: 'bg-red-200 dark:bg-red-800/40',
      text: 'text-red-800 dark:text-red-200',
      border: 'border-red-300 dark:border-red-700',
      icon: '💥'
    }
  }

  const stats = useMemo(() => {
    const totalAmount = data.reduce((sum, d) => sum + d.amount, 0)
    const totalTransactions = data.reduce((sum, d) => sum + d.count, 0)
    const averageAmount = totalAmount / data.length
    const maxDay = data.reduce((max, d) => d.amount > max.amount ? d : max, data[0])
    const minDay = data.reduce((min, d) => d.amount < min.amount ? d : min, data[0])
    const highestAvgDay = data.reduce((max, d) => (d.average || d.amount / d.count) > (max.average || 0) ? d : max, data[0])
    
    return {
      totalAmount,
      totalTransactions,
      averageAmount,
      maxDay,
      minDay,
      highestAvgDay,
      mostActiveDay: data.reduce((max, d) => d.count > max.count ? d : max, data[0])
    }
  }, [data])

  const maxAmount = Math.max(...data.map(d => d.amount), 1)

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-red-500" />
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-green-500" />
    return <Activity className="w-3 h-3 text-gray-500" />
  }

  const handleDayClick = (day: string) => {
    setSelectedDay(selectedDay === day ? null : day)
    onDayClick?.(day)
  }

  const downloadHeatmapData = () => {
    const csvContent = [
      ['Day', 'Amount', 'Transactions', 'Average'],
      ...data.map(d => [d.day, d.amount, d.count, d.average || (d.amount / d.count).toFixed(2)])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `heatmap_data_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Prepare chart data for pie chart
  const pieChartData = data.map(item => ({
    name: item.day,
    value: item.amount,
    count: item.count
  }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-white/80 text-xs">Daily spending pattern analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'compact' : 'grid')}
              className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
              title={viewMode === 'grid' ? 'Compact View' : 'Grid View'}
            >
              {viewMode === 'grid' ? <Minimize2 className="w-4 h-4 text-white" /> : <Maximize2 className="w-4 h-4 text-white" />}
            </button>
            
            {/* Stats Toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
              title="Show Statistics"
            >
              <BarChart3 className="w-4 h-4 text-white" />
            </button>
            
            {/* Download Button */}
            <button
              onClick={downloadHeatmapData}
              className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-all"
              title="Download Data"
            >
              <Download className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Total Spent</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Transactions</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalTransactions}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Daily Average</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.averageAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Highest Day</p>
                  <p className="text-lg font-bold text-red-600">{stats.maxDay.day}: {formatCurrency(stats.maxDay.amount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Lowest Day</p>
                  <p className="text-lg font-bold text-green-600">{stats.minDay.day}: {formatCurrency(stats.minDay.amount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Most Active</p>
                  <p className="text-lg font-bold text-purple-600">{stats.mostActiveDay.day}: {stats.mostActiveDay.count} txns</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Spending Intensity:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              <span className="text-gray-600">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-200 rounded"></div>
              <span className="text-gray-600">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-200 rounded"></div>
              <span className="text-gray-600">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 rounded"></div>
              <span className="text-gray-600">Very High</span>
            </div>
          </div>
          
          {selectedDay && (
            <div className="flex items-center gap-1 text-xs text-blue-500">
              <Info className="w-3 h-3" />
              <span>Click day to view details</span>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-4 sm:p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
            {data.map((item, index) => {
              const intensity = getIntensity(item.amount, maxAmount)
              const isSelected = selectedDay === item.day
              
              return (
                <motion.button
                  key={item.day}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDayClick(item.day)}
                  className={`p-3 rounded-xl text-center transition-all cursor-pointer border-2 ${
                    intensity.bg
                  } ${intensity.text} ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  } hover:shadow-md`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{item.day.substring(0, 3)}</span>
                    {getTrendIcon(item.trend)}
                  </div>
                  <p className="text-base sm:text-lg font-bold mt-1">{formatCurrency(item.amount)}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Activity className="w-3 h-3 opacity-60" />
                    <p className="text-xs">{item.count} txns</p>
                  </div>
                  {item.average && (
                    <p className="text-xs opacity-75 mt-1">
                      avg: {formatCurrency(item.average)}
                    </p>
                  )}
                </motion.button>
              )
            })}
          </div>
        ) : (
          // Compact View
          <div className="space-y-2">
            {data.map((item, index) => {
              const intensity = getIntensity(item.amount, maxAmount)
              const widthPercentage = (item.amount / maxAmount) * 100
              
              return (
                <motion.button
                  key={item.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleDayClick(item.day)}
                  className={`relative flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border ${intensity.border} hover:shadow-md`}
                >
                  <div className="relative z-10 flex items-center gap-3 flex-1">
                    <div className="w-12 text-left">
                      <p className="font-semibold text-sm">{item.day.substring(0, 3)}</p>
                      <p className="text-xs text-gray-500">{item.count} txns</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                        {getTrendIcon(item.trend)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-500 ${intensity.bg.replace('bg-', 'bg-').replace('/20', '')}`}
                          style={{ width: `${widthPercentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-2xl">
                      {intensity.icon}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Day Details Modal */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setSelectedDay(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="absolute top-3 right-3 p-1.5 bg-white/20 rounded-lg"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <h3 className="text-xl font-bold text-white">{selectedDay}</h3>
                  <p className="text-white/80 text-sm">Day Details</p>
                </div>
                
                <div className="p-6">
                  {(() => {
                    const dayData = data.find(d => d.day === selectedDay)
                    if (!dayData) return null
                    
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">Total Spent</p>
                            <p className="text-xl font-bold text-red-500">{formatCurrency(dayData.amount)}</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">Transactions</p>
                            <p className="text-xl font-bold text-blue-500">{dayData.count}</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">Average per Transaction</p>
                            <p className="text-xl font-bold text-purple-500">{formatCurrency(dayData.average || (dayData.amount / dayData.count))}</p>
                          </div>
                          <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500">Share of Week</p>
                            <p className="text-xl font-bold text-green-500">{((dayData.amount / stats.totalAmount) * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-xs text-gray-500 mb-2">Recommendation</p>
                          {dayData.amount > stats.averageAmount * 1.5 ? (
                            <p className="text-sm text-orange-600">⚠️ High spending day. Consider budgeting for this day of the week.</p>
                          ) : dayData.amount < stats.averageAmount * 0.5 ? (
                            <p className="text-sm text-green-600">✅ Great job! Low spending day.</p>
                          ) : (
                            <p className="text-sm text-blue-600">📊 Spending is within normal range.</p>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Summary */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3" />
            <span>Weekly Total: {formatCurrency(stats.totalAmount)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-3 h-3" />
            <span>Best Day: {stats.minDay.day} ({formatCurrency(stats.minDay.amount)})</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Worst Day: {stats.maxDay.day} ({formatCurrency(stats.maxDay.amount)})</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpenseHeatmap