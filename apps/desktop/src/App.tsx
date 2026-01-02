import { useEffect, useState } from 'react'
import { FlowMode } from './components/FlowMode'
import FocusMode from './components/FocusMode/FocusMode'
import { AuthPage } from './components/Auth'
import { useSableStore } from './store/sableStore'
import { useAuth } from './hooks/useAuth'
import { Loader2 } from 'lucide-react'

function App() {
  const { mode, setScreenSize, toggleFocusMode } = useSableStore()
  const { isAuthenticated, isLoading } = useAuth()
  const [isAuthWindow, setIsAuthWindow] = useState(false)

  // Check if this is the auth window (loaded with #/auth hash)
  useEffect(() => {
    if (window.location.hash === '#/auth') {
      setIsAuthWindow(true)
    }
  }, [])

  // Listen for auth success in main window
  useEffect(() => {
    const cleanup = window.electronAPI?.onAuthSuccess(() => {
      // Force re-check auth state
      window.location.reload()
    })
    return cleanup
  }, [])

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

  // If this is the auth window, render the auth page
  if (isAuthWindow) {
    return <AuthPage />
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  // Show prompt to open auth window if not authenticated
  if (!isAuthenticated) {
    return <LoginPrompt />
  }

  return (
    <div className="w-screen h-screen bg-transparent">
      {/* Flow Mode - only render when in flow mode */}
      {mode === 'flow' && <FlowMode />}
      
      {/* Focus Mode - overlays on top when active */}
      <FocusMode />
    </div>
  )
}

// Simple prompt shown in main overlay window
function LoginPrompt() {
  const handleOpenAuth = () => {
    window.electronAPI?.openAuthWindow()
  }

  return (
    <div className="w-screen h-screen bg-transparent flex items-center justify-center">
      <div 
        className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-8 border border-neutral-700/50 shadow-2xl max-w-sm text-center"
        onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
        onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-3xl font-bold text-white">S</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Welcome to Sable</h2>
        <p className="text-neutral-400 text-sm mb-6">Sign in to start using your AI assistant</p>
        <button
          onClick={handleOpenAuth}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200"
        >
          Sign In
        </button>
      </div>
    </div>
  )
}

export default App
