import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, TrendingUp, Target, FileText, 
  CreditCard, PiggyBank, Menu, X, Wallet,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'from-blue-500 to-cyan-500' },
  { name: 'Transactions', href: '/transactions', icon: CreditCard, color: 'from-green-500 to-emerald-500' },
  { name: 'Budgets', href: '/budgets', icon: Target, color: 'from-orange-500 to-red-500' },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
  { name: 'Savings', href: '/savings', icon: PiggyBank, color: 'from-yellow-500 to-amber-500' },
  { name: 'Reports', href: '/reports', icon: FileText, color: 'from-indigo-500 to-purple-500' },
]

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  // Auto expand on hover, collapse on leave
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (!isHovering && isExpanded) {
      timeout = setTimeout(() => {
        setIsExpanded(false)
      }, 300)
    } else if (isHovering && !isExpanded) {
      setIsExpanded(true)
    }
    return () => clearTimeout(timeout)
  }, [isHovering, isExpanded])

  const handleMouseEnter = () => {
    setIsHovering(true)
    setIsExpanded(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setIsExpanded(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
      >
        <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Desktop Sidebar - Hover to Expand */}
      <motion.aside
        initial={{ width: 72 }}
        animate={{ width: isExpanded ? 260 : 72 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
        style={{ boxShadow: '4px 0 20px rgba(0,0,0,0.05)' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-800">
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Wallet className="w-5 h-5 text-white" />
            </motion.div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-3 overflow-hidden"
                >
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    PaisaVedh
                  </h1>
                  <p className="text-[10px] text-gray-500 -mt-0.5">Smart Finance</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-6 px-3 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link key={item.name} to={item.href}>
                  <motion.div
                    whileHover={{ x: 5 }}
                    className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-sm'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebar"
                        className="absolute left-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"
                      />
                    )}
                    
                    {/* Icon */}
                    <div className={`relative ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    
                    {/* Label */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className={`text-sm font-medium whitespace-nowrap ${
                            isActive 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Tooltip for collapsed state */}
                    {!isExpanded && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Decoration */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3">
              <AnimatePresence>
                {isExpanded ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">₹</span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Smart Budgeting</p>
                    <p className="text-[10px] text-gray-500 mt-1">Track your finances</p>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">₹</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 bg-white dark:bg-gray-900 shadow-2xl lg:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        PaisaVedh
                      </h1>
                      <p className="text-[10px] text-gray-500 -mt-0.5">Smart Finance</p>
                    </div>
                  </div>
                  <button onClick={() => setIsMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <Link key={item.name} to={item.href} onClick={() => setIsMobileOpen(false)}>
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive
                            ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}>
                          <item.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Hover Hint */}
      {!isExpanded && !isMobileOpen && (
        <div className="hidden lg:block fixed left-[72px] top-1/2 transform -translate-y-1/2 z-30">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-r-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity">
            Hover to expand
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar