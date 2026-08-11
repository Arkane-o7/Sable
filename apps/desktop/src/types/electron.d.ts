// Global type declarations for Electron IPC APIs

interface ClipboardData {
  type: 'text' | 'image'
  content: string
}

interface SystemNotification {
  id: string
  appId: string
  appName: string
  title: string
  message: string
  timestamp: number
}

declare global {
  interface Window {
    electronAPI: {
      // Mouse events
      setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void
      toggleAlwaysOnTop: (value: boolean) => void
      getScreenSize: () => Promise<{ width: number; height: number }>
      
      // Global shortcuts
      onToggleChat: (callback: () => void) => () => void
      onMinimizeToDock: (callback: () => void) => () => void
      onToggleFocusMode: (callback: () => void) => () => void
      onToggleLauncher: (callback: () => void) => () => void
      
      // Clipboard APIs
      onClipboardChange: (callback: (data: ClipboardData) => void) => () => void
      clipboardWriteText: (text: string) => void
      clipboardWriteImage: (dataUrl: string) => void
      clipboardRead: () => Promise<ClipboardData | null>
      
      // Notification APIs
      startNotificationListener: () => Promise<{ success: boolean }>
      stopNotificationListener: () => Promise<{ success: boolean }>
      onSystemNotification: (callback: (notification: SystemNotification) => void) => () => void
      
      // Electron Store APIs (auth persistence)
      getStoreValue: (key: string) => Promise<unknown>
      setStoreValue: (key: string, value: unknown) => Promise<void>
      deleteStoreValue: (key: string) => Promise<void>
      
      // External URLs (OAuth)
      openExternal: (url: string) => Promise<void>
      
      // Auth window management
      openAuthWindow: () => Promise<void>
      closeAuthWindow: () => Promise<void>
      notifyAuthSuccess: () => void
      onAuthSuccess: (callback: () => void) => () => void
      onAuthWindowClosed: (callback: () => void) => () => void
      
      // Auth callback (deep link for OAuth)
      onAuthCallback: (callback: (url: string) => void) => () => void
    }
  }
}

export {}
