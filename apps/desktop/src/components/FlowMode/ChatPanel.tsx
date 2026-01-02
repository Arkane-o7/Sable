import { motion } from 'framer-motion'
import { Rnd } from 'react-rnd'
import { X, Minus, GripHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSableStore, ChatWindow } from '@/store/sableStore'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'

interface ChatPanelProps {
  chat: ChatWindow
}

export function ChatPanel({ chat }: ChatPanelProps) {
  const { 
    updateChatPosition, 
    updateChatSize, 
    closeChatWindow, 
    minimizeChatWindow,
    setActiveChatId,
    activeChatId 
  } = useSableStore()

  const isActive = activeChatId === chat.id

  const handleDragStart = () => {
    setActiveChatId(chat.id)
    window.electronAPI?.setIgnoreMouseEvents(false)
  }

  const handleDragStop = (_e: unknown, d: { x: number; y: number }) => {
    updateChatPosition(chat.id, { x: d.x, y: d.y })
  }

  const handleResizeStop = (
    _e: unknown,
    _direction: unknown,
    ref: HTMLElement,
    _delta: unknown,
    position: { x: number; y: number }
  ) => {
    updateChatSize(chat.id, {
      width: parseInt(ref.style.width),
      height: parseInt(ref.style.height)
    })
    updateChatPosition(chat.id, position)
  }

  const handleMouseEnter = () => {
    window.electronAPI?.setIgnoreMouseEvents(false)
  }

  const handleMouseLeave = () => {
    window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })
  }

  const handleMinimize = () => {
    minimizeChatWindow(chat.id)
    useSableStore.getState().setDocked(true)
  }

  const handleClose = () => {
    closeChatWindow(chat.id)
  }

  if (chat.isMinimized) return null

  return (
    <Rnd
      default={{
        x: chat.position.x,
        y: chat.position.y,
        width: chat.size.width,
        height: chat.size.height
      }}
      position={{ x: chat.position.x, y: chat.position.y }}
      size={{ width: chat.size.width, height: chat.size.height }}
      minWidth={320}
      minHeight={400}
      maxWidth={600}
      maxHeight={800}
      bounds="window"
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      dragHandleClassName="drag-handle"
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true
      }}
      resizeHandleStyles={{
        top: { cursor: 'ns-resize' },
        right: { cursor: 'ew-resize' },
        bottom: { cursor: 'ns-resize' },
        left: { cursor: 'ew-resize' },
        topRight: { cursor: 'nesw-resize' },
        bottomRight: { cursor: 'nwse-resize' },
        bottomLeft: { cursor: 'nesw-resize' },
        topLeft: { cursor: 'nwse-resize' }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setActiveChatId(chat.id)}
        className={cn(
          'w-full h-full flex flex-col',
          'rounded-2xl overflow-hidden',
          'bg-neutral-900/50',
          'border border-white/20',
          'shadow-2xl shadow-black/40',
          isActive && 'ring-1 ring-cyan-500/30'
        )}
      >
        {/* Header / Drag Handle */}
        <div 
          className={cn(
            'drag-handle flex items-center justify-between',
            'px-4 py-3',
            'border-b border-white/10',
            'cursor-move no-select'
          )}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-white/30" />
            <span className="text-white/70 text-sm font-medium">Sable</span>
          </div>
          
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMinimize}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Minus className="w-3.5 h-3.5 text-white/50 hover:text-white/80" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white/50 hover:text-red-400" />
            </motion.button>
          </div>
        </div>

        {/* Messages Area */}
        <ChatMessages messages={chat.messages} />

        {/* Input Area */}
        <ChatInput chatId={chat.id} />
      </motion.div>
    </Rnd>
  )
}
