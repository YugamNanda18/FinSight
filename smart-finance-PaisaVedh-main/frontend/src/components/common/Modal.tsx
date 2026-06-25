import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minimize2, Maximize2, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  showHeader?: boolean
  showFooter?: boolean
  footer?: React.ReactNode
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  className?: string
  onAfterOpen?: () => void
  onAfterClose?: () => void
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showHeader = true,
  showFooter = false,
  footer,
  variant = 'default',
  className = '',
  onAfterOpen,
  onAfterClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // Size configurations
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-[95vw] w-[95vw] h-[90vh]'
  }

  // Variant configurations
  const variantColors = {
    default: {
      header: 'bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800',
      icon: null
    },
    success: {
      header: 'bg-gradient-to-r from-green-500 to-emerald-600',
      icon: <CheckCircle className="w-5 h-5 text-white" />
    },
    error: {
      header: 'bg-gradient-to-r from-red-500 to-pink-600',
      icon: <AlertCircle className="w-5 h-5 text-white" />
    },
    warning: {
      header: 'bg-gradient-to-r from-yellow-500 to-orange-600',
      icon: <AlertCircle className="w-5 h-5 text-white" />
    },
    info: {
      header: 'bg-gradient-to-r from-blue-500 to-cyan-600',
      icon: <Info className="w-5 h-5 text-white" />
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Handle body scroll and lifecycle events
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      onAfterOpen?.()
    } else {
      document.body.style.overflow = 'unset'
      onAfterClose?.()
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onAfterOpen, onAfterClose])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2, type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden ${sizeClasses[size]} ${className} w-full`}
        >
          {/* Decorative gradient border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          {/* Header */}
          {showHeader && (
            <div className={`relative ${variantColors[variant].header} px-6 py-4 text-white`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {variantColors[variant].icon && (
                    <div className="p-1.5 bg-white/20 rounded-lg">
                      {variantColors[variant].icon}
                    </div>
                  )}
                  <h2 className="text-xl font-semibold">{title}</h2>
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors group"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`overflow-y-auto ${size === 'full' ? 'max-h-[calc(90vh-8rem)]' : 'max-h-[70vh]'} p-6`}>
            {children}
          </div>

          {/* Footer */}
          {showFooter && footer && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {footer}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Confirmation Modal Component
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const variantStyles = {
    danger: {
      button: 'bg-red-500 hover:bg-red-600',
      icon: <AlertCircle className="w-6 h-6 text-red-500" />
    },
    warning: {
      button: 'bg-yellow-500 hover:bg-yellow-600',
      icon: <AlertCircle className="w-6 h-6 text-yellow-500" />
    },
    info: {
      button: 'bg-blue-500 hover:bg-blue-600',
      icon: <Info className="w-6 h-6 text-blue-500" />
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      variant={variant === 'danger' ? 'error' : variant === 'warning' ? 'warning' : 'info'}
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          {variantStyles[variant].icon}
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 ${variantStyles[variant].button} text-white rounded-xl font-semibold transition-all disabled:opacity-50`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              confirmText
            )}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Drawer Modal (Side panel)
interface DrawerModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  position?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
}

export const DrawerModal: React.FC<DrawerModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[30rem]'
  }

  const positionClasses = {
    left: 'left-0',
    right: 'right-0'
  }

  const animationVariants = {
    left: {
      initial: { x: '-100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-100%', opacity: 0 }
    },
    right: {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '100%', opacity: 0 }
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={animationVariants[position].initial}
            animate={animationVariants[position].animate}
            exit={animationVariants[position].exit}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${positionClasses[position]} z-50 h-full bg-white dark:bg-gray-800 shadow-2xl ${sizeClasses[size]}`}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Modal