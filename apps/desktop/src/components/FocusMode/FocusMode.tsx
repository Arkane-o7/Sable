import { motion, AnimatePresence } from 'framer-motion'
import { useSableStore } from '../../store/sableStore'
import TopToolbar from './TopToolbar'
import WorkspaceSelector from './WorkspaceSelector'
import WidgetCanvas from './WidgetCanvas'

export default function FocusMode() {
  const { mode, toggleFocusMode } = useSableStore()
  
  return (
    <AnimatePresence>
      {mode === 'focus' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50"
          onMouseEnter={() => {
            window.electronAPI?.setIgnoreMouseEvents(false)
          }}
        >
          {/* Dark overlay background */}
          <div className="absolute inset-0 bg-black/60" />
          
          {/* Content container */}
          <div className="relative w-full h-full">
            {/* Widget Canvas (full screen - widgets can go anywhere) */}
            <div className="absolute inset-0">
              <WidgetCanvas />
            </div>
            
            {/* Top Toolbar - centered, floats above widgets */}
            <TopToolbar onExit={toggleFocusMode} />
            
            {/* Workspace Selector (bottom right, floats above widgets) */}
            <WorkspaceSelector />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
