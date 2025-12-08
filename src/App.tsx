import { useEffect } from 'react'
import { FlowMode } from './components/FlowMode'
import FocusMode from './components/FocusMode/FocusMode'
import { useSableStore } from './store/sableStore'

function App() {
  const { mode, setScreenSize, toggleFocusMode } = useSableStore()

  useEffect(() => {
    // Initialize screen size
    const initScreen = async () => {
      if (window.electronAPI) {
        const size = await window.electronAPI.getScreenSize()
        setScreenSize(size)
      } else {
        // Fallback for browser development
        setScreenSize({ width: window.innerWidth, height: window.innerHeight })
      }
    }
    initScreen()

    // Handle window resize
    const handleResize = () => {
      if (!window.electronAPI) {
        setScreenSize({ width: window.innerWidth, height: window.innerHeight })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setScreenSize])

  // Set up Focus Mode keyboard shortcut listener
  useEffect(() => {
    const cleanup = window.electronAPI?.onToggleFocusMode(() => {
      toggleFocusMode()
    })
    
    return cleanup
  }, [toggleFocusMode])

  return (
    <div className="w-screen h-screen bg-transparent">
      {/* Flow Mode - only render when in flow mode */}
      {mode === 'flow' && <FlowMode />}
      
      {/* Focus Mode - overlays on top when active */}
      <FocusMode />
    </div>
  )
}

export default App
