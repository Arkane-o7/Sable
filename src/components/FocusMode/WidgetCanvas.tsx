import { useCallback } from 'react'
import { useSableStore } from '../../store/sableStore'
import WidgetWrapper from './WidgetWrapper'
import { getWidgetConfig, WidgetInstance } from './widgets'
import { AnimatePresence, motion } from 'framer-motion'

// Import widgets to ensure they're registered
import './widgets'

export default function WidgetCanvas() {
  const { workspaces, activeWorkspaceId, isEditMode, updateWidgetData } = useSableStore()
  
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
  const widgets = activeWorkspace?.widgets || []

  // Render widget using the registry
  const renderWidget = useCallback((widget: WidgetInstance) => {
    const config = getWidgetConfig(widget.type)
    
    if (!config) {
      return (
        <div className="p-4 text-white/60 text-sm">
          <div className="text-white/40">Unknown widget: {widget.type}</div>
        </div>
      )
    }
    
    const WidgetComponent = config.component
    
    return (
      <WidgetComponent
        widgetId={widget.id}
        workspaceId={activeWorkspaceId}
        data={widget.data}
        isEditMode={isEditMode}
        updateData={(data) => updateWidgetData(activeWorkspaceId, widget.id, data)}
      />
    )
  }, [activeWorkspaceId, isEditMode, updateWidgetData])

  return (
    <div className="w-full h-full relative">
      {/* Empty state */}
      {widgets.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-xl font-medium text-white/60 mb-2">
              Welcome to Focus Mode
            </h2>
            <p className="text-sm max-w-md">
              Click "Add Widget" to get started. Add chat, sticky notes, and more to your workspace.
            </p>
          </motion.div>
        </div>
      )}
      
      {/* Widgets */}
      <AnimatePresence>
        {widgets.map(widget => (
          <WidgetWrapper
            key={widget.id}
            widget={widget}
            workspaceId={activeWorkspaceId}
          >
            {renderWidget(widget)}
          </WidgetWrapper>
        ))}
      </AnimatePresence>
    </div>
  )
}
