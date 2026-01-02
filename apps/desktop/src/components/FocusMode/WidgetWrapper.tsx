import { Rnd } from 'react-rnd'
import { motion } from 'framer-motion'
import { X, GripVertical } from 'lucide-react'
import { useSableStore } from '../../store/sableStore'
import { ReactNode } from 'react'
import { WidgetInstance, getWidgetConfig, getWidgetMinSize } from './widgets'

interface WidgetWrapperProps {
  widget: WidgetInstance
  workspaceId: string
  children: ReactNode
}

export default function WidgetWrapper({ widget, workspaceId, children }: WidgetWrapperProps) {
  const { 
    isEditMode, 
    updateWidgetPosition, 
    updateWidgetSize, 
    removeWidget 
  } = useSableStore()

  // Get widget config for label and min size
  const config = getWidgetConfig(widget.type)
  const minSize = getWidgetMinSize(widget.type)

  const handleDragStop = (_e: unknown, d: { x: number; y: number }) => {
    updateWidgetPosition(workspaceId, widget.id, { x: d.x, y: d.y })
  }

  const handleResizeStop = (
    _e: unknown,
    _direction: unknown,
    ref: HTMLElement,
    _delta: unknown,
    position: { x: number; y: number }
  ) => {
    updateWidgetSize(workspaceId, widget.id, {
      width: ref.offsetWidth,
      height: ref.offsetHeight
    })
    updateWidgetPosition(workspaceId, widget.id, position)
  }

  const handleRemove = () => {
    removeWidget(workspaceId, widget.id)
  }

  return (
    <Rnd
      position={widget.position}
      size={widget.size}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      disableDragging={!isEditMode}
      enableResizing={isEditMode ? {
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true
      } : false}
      minWidth={minSize.width}
      minHeight={minSize.height}
      bounds="parent"
      dragHandleClassName="widget-drag-handle"
      className="z-10"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className={`w-full h-full rounded-xl overflow-hidden shadow-lg flex flex-col ${
          isEditMode
            ? 'ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-transparent'
            : ''
        }`}
      >
        {/* Edit mode header with drag handle */}
        {isEditMode && (
          <div className="widget-drag-handle absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 bg-neutral-900/90 border-b border-white/10 cursor-move z-20">
            <div className="flex items-center gap-1.5 text-white/60">
              <GripVertical size={14} />
              <span className="text-[10px] font-medium uppercase tracking-wide">
                {config?.label ?? widget.type}
              </span>
            </div>
            <button
              onClick={handleRemove}
              className="p-0.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
        
        {/* Widget content */}
        <div className={`flex-1 overflow-hidden ${isEditMode ? 'pt-7' : ''}`}>
          {children}
        </div>
        
        {/* Resize indicator in edit mode */}
        {isEditMode && (
          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-cyan-400/60 rounded-br pointer-events-none" />
        )}
      </motion.div>
    </Rnd>
  )
}
