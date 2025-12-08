import { Plus, Crop, Mic, FileText, Command, X } from 'lucide-react'
import { useSableStore } from '../../store/sableStore'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAllWidgetConfigs, WidgetType } from './widgets'

interface TopToolbarProps {
  onExit: () => void
}

export default function TopToolbar({ onExit }: TopToolbarProps) {
  const { isEditMode, toggleEditMode, addWidget, activeWorkspaceId } = useSableStore()
  const [showAddMenu, setShowAddMenu] = useState(false)
  
  // Get all registered widgets from the registry
  const widgetConfigs = getAllWidgetConfigs()

  const handleAddWidget = (type: WidgetType) => {
    const config = widgetConfigs.find(c => c.type === type)
    addWidget(activeWorkspaceId, type, {}, config?.defaultSize)
    setShowAddMenu(false)
  }

  // Get current time
  const now = new Date()
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      {/* Centered pill toolbar */}
      <div className="flex items-center gap-1 px-2 py-2 rounded-full bg-neutral-800/90 border border-white/10 shadow-xl">
        {/* Add Widget Button */}
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Add Widget"
          >
            <Plus size={20} />
          </button>
          
          {/* Add Widget Menu */}
          <AnimatePresence>
            {showAddMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-2 w-44 rounded-xl bg-neutral-800 border border-white/10 shadow-2xl overflow-hidden"
              >
                {widgetConfigs.map((config) => (
                  <button
                    key={config.type}
                    onClick={() => handleAddWidget(config.type)}
                    className="w-full px-4 py-2.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left text-sm"
                  >
                    {config.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Screenshot/Crop */}
        <button
          className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Screenshot"
        >
          <Crop size={20} />
        </button>

        {/* Voice */}
        <button
          className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Voice Input"
        >
          <Mic size={20} />
        </button>

        {/* File */}
        <button
          className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          title="New File"
        >
          <FileText size={20} />
        </button>

        <div className="w-px h-5 bg-white/10" />

        {/* Time Display */}
        <div className="px-3 py-1.5 text-white/80 text-sm font-medium">
          {timeString}
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* Shortcuts */}
        <button
          onClick={toggleEditMode}
          className={`p-2.5 rounded-full transition-colors ${
            isEditMode 
              ? 'text-cyan-400 bg-cyan-500/20' 
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title={isEditMode ? 'Done Editing' : 'Edit Widgets'}
        >
          <Command size={20} />
        </button>

        <div className="w-px h-5 bg-white/10" />

        {/* Exit */}
        <button
          onClick={onExit}
          className="p-2.5 rounded-full text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Exit Focus Mode"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Click outside to close menu */}
      {showAddMenu && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setShowAddMenu(false)}
        />
      )}
    </div>
  )
}
