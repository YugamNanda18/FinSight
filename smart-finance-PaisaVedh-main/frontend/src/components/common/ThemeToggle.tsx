import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'

type Theme = 'light' | 'dark' | 'system'

const ThemeToggle = () => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system')

  React.useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (isDark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
    { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
    { value: 'system', icon: <Laptop className="w-4 h-4" />, label: 'System' },
  ]

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`relative p-2 rounded-lg transition-all ${
            theme === t.value
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t.icon}
          {theme === t.value && (
            <motion.div
              layoutId="activeTheme"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg -z-0"
              transition={{ type: 'spring', duration: 0.3 }}
            />
          )}
          <span className="sr-only">{t.label}</span>
        </button>
      ))}
    </div>
  )
}

export default ThemeToggle