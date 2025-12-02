import { useEffect } from 'react'
import { FlowMode } from './components/FlowMode'
import { useSableStore } from './store/sableStore'

function App() {
  const { mode, setScreenSize } = useSableStore()

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

  return (
    <div className="w-screen h-screen bg-transparent">
      {mode === 'flow' && <FlowMode />}
      {/* Focus Mode will be added later */}
    </div>
  )
}

export default App
