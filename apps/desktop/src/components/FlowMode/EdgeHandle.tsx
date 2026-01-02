import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSableStore } from '@/store/sableStore'
import { cn } from '@/lib/utils'

// Storage key for persisting position
const EDGE_POSITION_KEY = 'sable-edge-position'

export function EdgeHandle() {
  const { isDocked, chatWindows, createChatWindow, setDocked, screenSize } = useSableStore()
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [yPosition, setYPosition] = useState(() => {
    // Load saved position or default to center (50%)
    const saved = localStorage.getItem(EDGE_POSITION_KEY)
    return saved ? parseFloat(saved) : 50
  })
  
  const dragStartY = useRef(0)
  const dragStartPosition = useRef(0)
  
  // Count of minimized or no windows
  const hasActiveWindows = chatWindows.some(w => !w.isMinimized)
  const shouldShow = isDocked || !hasActiveWindows
  
  // Add a small delay before showing the edge handle to prevent hover glitch
  useEffect(() => {
    if (shouldShow) {
      // Reset hover state when becoming visible
      setIsHovered(false)
      // Small delay to let mouse events settle
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      setIsHovered(false)
    }
  }, [shouldShow])
  
  // Save position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(EDGE_POSITION_KEY, yPosition.toString())
  }, [yPosition])
  
  const handleClick = () => {
    // Don't trigger click if we were dragging
    if (isDragging) return
    
    if (chatWindows.length === 0) {
      createChatWindow()
    } else {
      // Restore or create new chat
      const minimizedWindow = chatWindows.find(w => w.isMinimized)
      if (minimizedWindow) {
        useSableStore.getState().restoreChatWindow(minimizedWindow.id)
      } else {
        createChatWindow()
      }
    }
    setDocked(false)
  }
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragStartY.current = e.clientY
    dragStartPosition.current = yPosition
    setIsDragging(false)
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY.current
      // If moved more than 5px, consider it a drag
      if (Math.abs(deltaY) > 5) {
        setIsDragging(true)
      }
      
      // Calculate new position as percentage
      const screenHeight = screenSize.height || window.innerHeight
      const deltaPercent = (deltaY / screenHeight) * 100
      let newPosition = dragStartPosition.current + deltaPercent
      
      // Clamp between 15% and 85% to keep it accessible
      newPosition = Math.max(15, Math.min(85, newPosition))
      setYPosition(newPosition)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      // Reset dragging state after a short delay to prevent click
      setTimeout(() => {
        setIsDragging(false)
      }, 100)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 z-50"
          style={{ top: `${yPosition}%`, transform: 'translateY(-50%)' }}
          onMouseEnter={(e) => {
            e.stopPropagation()
            setIsHovered(true)
            window.electronAPI?.setIgnoreMouseEvents(false)
          }}
          onMouseLeave={(e) => {
            e.stopPropagation()
            setIsHovered(false)
            window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })
          }}
        >
          {/* Expanded hover area for easier targeting */}
          <div className="absolute -left-4 -top-4 -bottom-4 right-0 pointer-events-auto" />
          
          <motion.div
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            whileTap={{ scale: isDragging ? 1 : 0.95 }}
            className={cn(
              'relative flex items-center justify-center',
              'h-32 rounded-l-xl',
              'bg-gradient-to-b from-white/20 to-white/10',
              'backdrop-blur-xl',
              'border border-r-0 border-white/20',
              'shadow-lg shadow-black/20',
              'transition-all duration-300 ease-out',
              'select-none',
              // Width expands on hover instead of moving
              isHovered ? 'w-6' : 'w-3',
              // Cursor changes based on state
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
          >
            {/* Glow effect on hover */}
            <motion.div 
              className="absolute inset-0 rounded-l-xl bg-gradient-to-r from-cyan-500/30 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            />
            
            {/* Handle dots */}
            <div className="flex flex-col gap-1.5">
              <motion.div 
                className="rounded-full bg-white/50"
                animate={{ 
                  width: isHovered ? 6 : 4,
                  height: isHovered ? 6 : 4,
                  backgroundColor: isHovered ? 'rgb(34, 211, 238)' : 'rgba(255,255,255,0.5)'
                }}
                transition={{ duration: 0.2 }}
              />
              <motion.div 
                className="rounded-full bg-white/50"
                animate={{ 
                  width: isHovered ? 6 : 4,
                  height: isHovered ? 6 : 4,
                  backgroundColor: isHovered ? 'rgb(34, 211, 238)' : 'rgba(255,255,255,0.5)'
                }}
                transition={{ duration: 0.2, delay: 0.05 }}
              />
              <motion.div 
                className="rounded-full bg-white/50"
                animate={{ 
                  width: isHovered ? 6 : 4,
                  height: isHovered ? 6 : 4,
                  backgroundColor: isHovered ? 'rgb(34, 211, 238)' : 'rgba(255,255,255,0.5)'
                }}
                transition={{ duration: 0.2, delay: 0.1 }}
              />
            </div>
            
            {/* Notification badge if has messages */}
            {chatWindows.length > 0 && (
              <motion.div 
                className="absolute -left-2 -top-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <span className="text-[10px] font-bold text-black">
                  {chatWindows.length}
                </span>
              </motion.div>
            )}
          </motion.div>
          
          {/* Tooltip - appears on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-full top-1/2 -translate-y-1/2 mr-3 pointer-events-none"
              >
                <div className="glass px-3 py-1.5 rounded-lg whitespace-nowrap">
                  <span className="text-white/90 text-sm">
                    {chatWindows.length === 0 ? 'Open Sable' : 'Show Chat'}
                  </span>
                  <span className="text-white/50 text-xs ml-2">Ctrl+Shift+Space</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
