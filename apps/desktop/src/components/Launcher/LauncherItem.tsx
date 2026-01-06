import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { SearchResult } from './Launcher'

interface LauncherItemProps {
  result: SearchResult
  isSelected: boolean
  onSelect: () => void
  onHover: () => void
}

export function LauncherItem({ result, isSelected, onSelect, onHover }: LauncherItemProps) {
  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'chat':
        return 'from-blue-500 to-blue-600'
      case 'action':
        return 'from-purple-500 to-purple-600'
      case 'command':
        return 'from-amber-500 to-orange-500'
      case 'app':
        return 'from-green-500 to-emerald-600'
      case 'quick-answer':
        return 'from-cyan-500 to-teal-600'
      default:
        return 'from-neutral-500 to-neutral-600'
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.15 }}
    >
      <button
        onClick={onSelect}
        onMouseEnter={onHover}
        className={`
          w-full flex items-center gap-3 px-5 py-3 text-left transition-colors
          ${isSelected 
            ? 'bg-neutral-800/80' 
            : 'hover:bg-neutral-800/50'
          }
        `}
      >
        {/* Icon */}
        <div className={`
          w-9 h-9 rounded-lg bg-gradient-to-br ${getTypeColor(result.type)}
          flex items-center justify-center text-white flex-shrink-0
          shadow-lg shadow-black/20
        `}>
          {result.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">
            {result.name}
          </p>
          <p className="text-neutral-400 text-sm truncate">
            {result.description}
          </p>
        </div>

        {/* Action indicator */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-neutral-400"
          >
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        )}
      </button>
    </motion.li>
  )
}
