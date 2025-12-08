import { contextBridge, ipcRenderer } from 'electron'

// Clipboard change event type
interface ClipboardData {
  type: 'text' | 'image'
  content: string
}

// System notification from sidecar
interface SystemNotification {
  id: string
  appId: string
  appName: string
  title: string
  message: string
  timestamp: number
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Mouse events handling for click-through
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore, options)
  },
  
  // Toggle always on top
  toggleAlwaysOnTop: (value: boolean) => {
    ipcRenderer.send('toggle-always-on-top', value)
  },
  
  // Get screen dimensions
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),
  
  // Listen for global shortcuts
  onToggleChat: (callback: () => void) => {
    ipcRenderer.on('toggle-chat', callback)
    return () => ipcRenderer.removeListener('toggle-chat', callback)
  },
  
  onMinimizeToDock: (callback: () => void) => {
    ipcRenderer.on('minimize-to-dock', callback)
    return () => ipcRenderer.removeListener('minimize-to-dock', callback)
  },
  
  onToggleFocusMode: (callback: () => void) => {
    ipcRenderer.on('toggle-focus-mode', callback)
    return () => ipcRenderer.removeListener('toggle-focus-mode', callback)
  },
  
  // Clipboard APIs
  onClipboardChange: (callback: (data: ClipboardData) => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: ClipboardData) => callback(data)
    ipcRenderer.on('clipboard-changed', handler)
    return () => ipcRenderer.removeListener('clipboard-changed', handler)
  },
  
  clipboardWriteText: (text: string) => {
    ipcRenderer.send('clipboard-write-text', text)
  },
  
  clipboardWriteImage: (dataUrl: string) => {
    ipcRenderer.send('clipboard-write-image', dataUrl)
  },
  
  clipboardRead: () => ipcRenderer.invoke('clipboard-read') as Promise<ClipboardData | null>,
  
  // Notification APIs
  startNotificationListener: () => ipcRenderer.invoke('start-notification-listener'),
  stopNotificationListener: () => ipcRenderer.invoke('stop-notification-listener'),
  
  onSystemNotification: (callback: (notification: SystemNotification) => void) => {
    const handler = (_: Electron.IpcRendererEvent, notification: SystemNotification) => callback(notification)
    ipcRenderer.on('system-notification', handler)
    return () => ipcRenderer.removeListener('system-notification', handler)
  },
  
  // Electron Store APIs (for auth persistence)
  getStoreValue: (key: string) => ipcRenderer.invoke('store-get', key),
  setStoreValue: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),
  deleteStoreValue: (key: string) => ipcRenderer.invoke('store-delete', key),
  
  // Open external URL (for OAuth)
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  // Auth callback listener (deep link for OAuth)
  onAuthCallback: (callback: (url: string) => void) => {
    const handler = (_: Electron.IpcRendererEvent, url: string) => callback(url)
    ipcRenderer.on('auth-callback', handler)
    return () => ipcRenderer.removeListener('auth-callback', handler)
  },
})

// Type declarations for the exposed API
declare global {
  interface Window {
    electronAPI: {
      setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void
      toggleAlwaysOnTop: (value: boolean) => void
      getScreenSize: () => Promise<{ width: number; height: number }>
      onToggleChat: (callback: () => void) => () => void
      onMinimizeToDock: (callback: () => void) => () => void
      onToggleFocusMode: (callback: () => void) => () => void
      // Clipboard APIs
      onClipboardChange: (callback: (data: { type: 'text' | 'image'; content: string }) => void) => () => void
      clipboardWriteText: (text: string) => void
      clipboardWriteImage: (dataUrl: string) => void
      clipboardRead: () => Promise<{ type: 'text' | 'image'; content: string } | null>
      // Notification APIs
      startNotificationListener: () => Promise<{ success: boolean }>
      stopNotificationListener: () => Promise<{ success: boolean }>
      onSystemNotification: (callback: (notification: {
        id: string
        appId: string
        appName: string
        title: string
        message: string
        timestamp: number
      }) => void) => () => void
      // Electron Store APIs
      getStoreValue: (key: string) => Promise<unknown>
      setStoreValue: (key: string, value: unknown) => Promise<void>
      deleteStoreValue: (key: string) => Promise<void>
      // External URLs
      openExternal: (url: string) => Promise<void>
      // Auth callback (deep link for OAuth)
      onAuthCallback: (callback: (url: string) => void) => () => void
    }
  }
}
