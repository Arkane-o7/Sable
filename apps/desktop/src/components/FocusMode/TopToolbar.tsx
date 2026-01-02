import { Plus, Crop, Mic, FileText, Command, X, Settings, LogOut, User, Bell, Palette, HelpCircle, Keyboard, ExternalLink } from 'lucide-react'
import { useSableStore } from '../../store/sableStore'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAllWidgetConfigs, WidgetType } from './widgets'
import { useAuth } from '../../hooks/useAuth'

interface TopToolbarProps {
  onExit: () => void
}

export default function TopToolbar({ onExit }: TopToolbarProps) {
  const { isEditMode, toggleEditMode, addWidget, activeWorkspaceId } = useSableStore()
  const { user, signOut } = useAuth()
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const settingsMenuRef = useRef<HTMLDivElement>(null)
  
  // Get all registered widgets from the registry
  const widgetConfigs = getAllWidgetConfigs()

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddWidget = (type: WidgetType) => {
    const config = widgetConfigs.find(c => c.type === type)
    addWidget(activeWorkspaceId, type, {}, config?.defaultSize)
    setShowAddMenu(false)
  }

  const handleSignOut = async () => {
    setShowSettingsMenu(false)
    await signOut()
    window.location.reload()
  }

  const handleOpenAccountSettings = () => {
    setShowSettingsMenu(false)
    // Open Clerk's user profile in external browser
    window.electronAPI?.openExternal('https://accounts.clerk.dev/user')
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

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsMenuRef}>
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`p-2.5 rounded-full transition-colors ${
              showSettingsMenu 
                ? 'text-white bg-white/10' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title="Settings"
          >
            {user?.profilePictureUrl ? (
              <img 
                src={user.profilePictureUrl} 
                alt="Profile" 
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <Settings size={20} />
            )}
          </button>

          {/* Settings Menu */}
          <AnimatePresence>
            {showSettingsMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-64 rounded-xl bg-neutral-800 border border-white/10 shadow-2xl overflow-hidden"
              >
                {/* User Info */}
                {user && (
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      {user.profilePictureUrl ? (
                        <img 
                          src={user.profilePictureUrl} 
                          alt="Profile" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {user.firstName?.[0] || user.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                        </p>
                        <p className="text-white/50 text-xs truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={handleOpenAccountSettings}
                    className="w-full px-4 py-2.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left text-sm flex items-center gap-3"
                  >
                    <User size={16} />
                    Account Settings
                    <ExternalLink size={12} className="ml-auto text-white/40" />
                  </button>
                  
                  <button
                    className="w-full px-4 py-2.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left text-sm flex items-center gap-3"
                  >
                    <Palette size={16} />
                    Appearance
                  </button>
                  
                  <button
                    className="w-full px-4 py-2.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left text-sm flex items-center gap-3"
                  >
                    <Bell size={16} />
                    Notifications
                  </button>
                  
                  <button
                    className="w-full px-4 py-2.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left text-sm flex items-center gap-3"
                  >
                    <Keyboard size={16} />
                    Keyboard Shortcuts
                  </button>
                </div>

                <div className="border-t border-white/10 py-1">
                  <button
                    className="w-full px-4 py-2.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left text-sm flex items-center gap-3"
                  >
                    <HelpCircle size={16} />
                    Help & Support
                  </button>
                </div>

                <div className="border-t border-white/10 py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-left text-sm flex items-center gap-3"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
