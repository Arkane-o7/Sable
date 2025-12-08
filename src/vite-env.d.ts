/// <reference types="vite/client" />
/// <reference path="./types/electron.d.ts" />

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY: string
  readonly VITE_TAVILY_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Clipboard data type
interface ClipboardData {
  type: 'text' | 'image'
  content: string
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
      onToggleFocusMode: (callback: () => void) => () => void
      // Clipboard APIs
      onClipboardChange: (callback: (data: ClipboardData) => void) => () => void
      clipboardWriteText: (text: string) => void
      clipboardWriteImage: (dataUrl: string) => void
      clipboardRead: () => Promise<ClipboardData | null>
    }
  }
}

export {}
