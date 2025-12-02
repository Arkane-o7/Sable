import { contextBridge, ipcRenderer } from 'electron'

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
    }
  }
}
