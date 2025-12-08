import { Plus, X } from 'lucide-react'
import { useSableStore } from '../../store/sableStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function WorkspaceSelector() {
  const { 
    workspaces, 
    activeWorkspaceId, 
    setActiveWorkspace, 
    createWorkspace,
    deleteWorkspace
  } = useSableStore()

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  const handleDelete = (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation()
    
    // If this workspace has widgets, show confirmation
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (workspace && workspace.widgets.length > 0) {
      setShowConfirm(workspaceId)
    } else {
      deleteWorkspace(workspaceId)
    }
  }

  const confirmDelete = (workspaceId: string) => {
    deleteWorkspace(workspaceId)
    setShowConfirm(null)
  }

  const canDelete = workspaces.length > 1

  return (
    <div className="absolute bottom-4 right-4 z-50">
      {/* Confirmation popup */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 p-3 rounded-xl bg-neutral-800 border border-white/10 shadow-xl min-w-[180px]"
          >
            <p className="text-white/80 text-xs mb-3">Delete this workspace and all its widgets?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showConfirm)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-neutral-800/90 border border-white/10 shadow-xl">
        {workspaces.map((workspace, index) => (
          <div 
            key={workspace.id}
            className="relative"
            onMouseEnter={() => setHoveredId(workspace.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <motion.button
              onClick={() => setActiveWorkspace(workspace.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-7 h-7 rounded-full font-medium text-xs transition-all ${
                activeWorkspaceId === workspace.id
                  ? 'bg-white text-neutral-900'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {index + 1}
            </motion.button>
            
            {/* Delete button - shows on hover if more than 1 workspace */}
            <AnimatePresence>
              {canDelete && hoveredId === workspace.id && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  onClick={(e) => handleDelete(e, workspace.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-colors shadow-lg"
                >
                  <X size={10} strokeWidth={3} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ))}
        
        {/* Add workspace button */}
        <motion.button
          onClick={createWorkspace}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-7 h-7 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
          title="Add Workspace"
        >
          <Plus size={14} />
        </motion.button>
      </div>
    </div>
  )
}
