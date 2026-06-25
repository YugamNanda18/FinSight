import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, TrendingUp, TrendingDown, AlertCircle, Lightbulb, 
  Zap, Target, Bell, DollarSign, CreditCard, Calendar,
  CheckCircle, XCircle, Sparkles, Rocket, Star, Award,
  Clock, Wallet, Shield, BarChart3, PieChart, Settings,
  ThumbsUp, ThumbsDown, Bookmark, Share2, ExternalLink
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { analyticsService } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

// Types
interface Recommendation {
  id: string
  title: string
  description: string
  type: 'savings' | 'investment' | 'budget' | 'alert'
  priority: 'high' | 'medium' | 'low'
  potentialSavings?: number
  actionText?: string
  actionLink?: string
  category?: string
  isApplied?: boolean
  createdAt?: string
}

interface AIInsights {
  recommendations: Recommendation[]
  savingsOpportunities: {
    count: number
    totalAmount: number
    items: Array<{
      category: string
      potentialSavings: number
      suggestion: string
    }>
  }
  spendingPatterns: {
    topCategory: string
    growthRate: number
    unusualSpending: Array<{
      category: string
      amount: number
      expectedAmount: number
      difference: number
    }>
  }
  financialHealth: {
    score: number
    status: 'excellent' | 'good' | 'fair' | 'poor'
    nextMilestone: string
  }
}

const AIRecommendations: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const queryClient = useQueryClient()

  const { data: insights, isLoading, error, refetch } = useQuery<AIInsights>(
    'ai-insights',
    () => analyticsService.getInsights().then(res => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Failed to fetch AI insights:', error)
        toast.error('Unable to load AI recommendations')
      }
    }
  )

  const applyRecommendationMutation = useMutation(
    (id: string) => analyticsService.applyRecommendation(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ai-insights')
        toast.success('Recommendation applied successfully! 🎉')
      },
      onError: () => toast.error('Failed to apply recommendation')
    }
  )

  const dismissRecommendation = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    toast.success('Recommendation dismissed')
  }, [])

  const handleApply = useCallback(async (id: string) => {
    await applyRecommendationMutation.mutateAsync(id)
  }, [applyRecommendationMutation])

  const handleRefresh = useCallback(() => {
    refetch()
    toast.success('Refreshing recommendations...')
  }, [refetch])

  // Get recommendations, filtering out dismissed ones
  const activeRecommendations = useMemo(() => {
    if (!insights?.recommendations) return []
    return insights.recommendations.filter(rec => !dismissedIds.has(rec.id))
  }, [insights, dismissedIds])

  // Stats summary
  const stats = useMemo(() => {
    if (!activeRecommendations.length) return null
    const totalSavings = activeRecommendations.reduce((sum, rec) => sum + (rec.potentialSavings || 0), 0)
    const highPriorityCount = activeRecommendations.filter(rec => rec.priority === 'high').length
    return { totalSavings, highPriorityCount, totalCount: activeRecommendations.length }
  }, [activeRecommendations])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-orange-500'
      case 'medium': return 'from-yellow-500 to-amber-500'
      default: return 'from-green-500 to-emerald-500'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />
      case 'medium': return <Clock className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'savings': return <PiggyBank className="w-4 h-4" />
      case 'investment': return <TrendingUp className="w-4 h-4" />
      case 'budget': return <Target className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getGradient = (index: number) => {
    const gradients = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-yellow-500 to-amber-500',
    ]
    return gradients[index % gradients.length]
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="text-center py-8">
          <div className="inline-flex p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unable to Load Insights</h3>
          <p className="text-sm text-gray-500 mb-4">Please check your connection and try again</p>
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
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 px-6 py-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl animate-pulse">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Financial Assistant</h2>
                <p className="text-white/80 text-sm">Personalized insights based on your spending patterns</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm hover:bg-white/30 transition-all"
              >
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </button>
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm hover:bg-white/30 transition-all"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          {stats && stats.totalCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
                <span className="text-xs text-white/80">{stats.totalCount} Recommendations</span>
              </div>
              {stats.highPriorityCount > 0 && (
                <div className="px-3 py-1.5 bg-red-500/30 backdrop-blur-sm rounded-lg">
                  <span className="text-xs text-white">{stats.highPriorityCount} High Priority</span>
                </div>
              )}
              {stats.totalSavings > 0 && (
                <div className="px-3 py-1.5 bg-green-500/30 backdrop-blur-sm rounded-lg">
                  <span className="text-xs text-white">Save up to {formatCurrency(stats.totalSavings)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Financial Health Score */}
      {insights?.financialHealth && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Financial Health Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{insights.financialHealth.score}/100</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-600">{insights.financialHealth.status.toUpperCase()}</p>
              <p className="text-xs text-gray-500">Next: {insights.financialHealth.nextMilestone}</p>
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${insights.financialHealth.score}%` }}
              transition={{ duration: 0.8 }}
              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Spending Pattern Alert */}
      {insights?.spendingPatterns?.unusualSpending?.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">Unusual Spending Detected</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                Your spending in {insights.spendingPatterns.unusualSpending[0]?.category} is 
                {formatCurrency(insights.spendingPatterns.unusualSpending[0]?.difference)} above normal
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Grid/List */}
      <div className="p-6">
        {activeRecommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
            <p className="text-sm text-gray-500">You've addressed all current recommendations. Great job!</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRecommendations.map((rec, index) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                index={index}
                isExpanded={expandedId === rec.id}
                onToggleExpand={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                onApply={() => handleApply(rec.id)}
                onDismiss={() => dismissRecommendation(rec.id)}
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
                getTypeIcon={getTypeIcon}
                getGradient={getGradient}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {activeRecommendations.map((rec, index) => (
              <RecommendationListItem
                key={rec.id}
                recommendation={rec}
                index={index}
                onApply={() => handleApply(rec.id)}
                onDismiss={() => dismissRecommendation(rec.id)}
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
                getTypeIcon={getTypeIcon}
                getGradient={getGradient}
              />
            ))}
          </div>
        )}
      </div>

      {/* Savings Opportunity Section */}
      {insights?.savingsOpportunities && insights.savingsOpportunities.count > 0 && (
        <div className="mx-6 mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-400">
                💰 Savings Opportunity Found!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                We found {insights.savingsOpportunities.count} ways to save up to {formatCurrency(insights.savingsOpportunities.totalAmount)} this month
              </p>
              <button className="mt-2 text-xs font-medium text-green-600 hover:text-green-700">
                View Details →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Sparkles className="w-3 h-3" />
          <span>AI-powered recommendations based on your transaction history</span>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-blue-500 hover:text-blue-600 font-medium"
        >
          Refresh Insights
        </button>
      </div>
    </div>
  )
}

// Recommendation Card Component (Grid View)
const RecommendationCard: React.FC<{
  recommendation: Recommendation
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onApply: () => void
  onDismiss: () => void
  getPriorityColor: (priority: string) => string
  getPriorityIcon: (priority: string) => React.ReactNode
  getTypeIcon: (type: string) => React.ReactNode
  getGradient: (index: number) => string
}> = ({
  recommendation,
  index,
  isExpanded,
  onToggleExpand,
  onApply,
  onDismiss,
  getPriorityColor,
  getPriorityIcon,
  getTypeIcon,
  getGradient,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
    >
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${getPriorityColor(recommendation.priority)}`} />
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${getGradient(index)} bg-opacity-10`}>
              {getTypeIcon(recommendation.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-white">{recommendation.title}</h3>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${getPriorityColor(recommendation.priority)} text-white`}>
                  {getPriorityIcon(recommendation.priority)}
                  {recommendation.priority}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{recommendation.description}</p>
              
              {isExpanded && recommendation.category && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <PieChart className="w-3 h-3" />
                    <span>Category: {recommendation.category}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          {recommendation.potentialSavings && recommendation.potentialSavings > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Potential Savings</p>
              <p className="text-sm font-bold text-green-500">{formatCurrency(recommendation.potentialSavings)}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={onToggleExpand}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            Dismiss
          </button>
          <button
            onClick={onApply}
            className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-md transition-all"
          >
            Apply Now
          </button>
        </div>
      </div>

      {/* Hover Glow Effect */}
      {isHovered && (
        <div className={`absolute inset-0 bg-gradient-to-r ${getGradient(index)} opacity-0 -z-10 transition-opacity duration-300`} style={{ opacity: 0.05 }} />
      )}
    </motion.div>
  )
}

// Recommendation List Item Component (List View)
const RecommendationListItem: React.FC<{
  recommendation: Recommendation
  index: number
  onApply: () => void
  onDismiss: () => void
  getPriorityColor: (priority: string) => string
  getPriorityIcon: (priority: string) => React.ReactNode
  getTypeIcon: (type: string) => React.ReactNode
  getGradient: (index: number) => string
}> = ({
  recommendation,
  index,
  onApply,
  onDismiss,
  getPriorityColor,
  getPriorityIcon,
  getTypeIcon,
  getGradient,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${getGradient(index)}`}>
          {getTypeIcon(recommendation.type)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900 dark:text-white">{recommendation.title}</h3>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${getPriorityColor(recommendation.priority)} text-white`}>
              {getPriorityIcon(recommendation.priority)}
              {recommendation.priority}
            </div>
          </div>
          <p className="text-sm text-gray-500 line-clamp-1">{recommendation.description}</p>
        </div>
        {recommendation.potentialSavings && recommendation.potentialSavings > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Save</p>
            <p className="text-sm font-bold text-green-500">{formatCurrency(recommendation.potentialSavings)}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={onDismiss}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <XCircle className="w-4 h-4" />
        </button>
        <button
          onClick={onApply}
          className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-md transition-all"
        >
          Apply
        </button>
      </div>
    </motion.div>
  )
}

export default AIRecommendations