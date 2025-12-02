/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron API types
declare global {
  interface Window {
    electronAPI?: {
      setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void
      toggleAlwaysOnTop: (value: boolean) => void
      getScreenSize: () => Promise<{ width: number; height: number }>
      onToggleChat: (callback: () => void) => () => void
      onMinimizeToDock: (callback: () => void) => () => void
    }
  }
}

export {}
