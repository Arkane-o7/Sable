import { useState, useEffect } from 'react'
import { Clipboard, Copy, Trash2, Image, FileText, Check } from 'lucide-react'
import { WidgetComponentProps, WidgetConfig } from './types'
import { registerWidget } from './registry'

// ============= Widget Configuration =============
export const clipboardWidgetConfig: WidgetConfig = {
  type: 'clipboard',
  label: 'Clipboard',
  defaultSize: { width: 260, height: 320 },
  minSize: { width: 200, height: 200 },
  component: ClipboardWidget,
}

// ============= Types =============
interface ClipboardItem {
  id: string
  type: 'text' | 'image'
  content: string
  timestamp: number
  preview?: string
}

// ============= Widget Component =============
// Extended Electron API type for clipboard
interface ElectronClipboardAPI {
  onClipboardChange?: (callback: (data: { type: 'text' | 'image'; content: string }) => void) => () => void
  clipboardWriteText?: (text: string) => void
  clipboardWriteImage?: (dataUrl: string) => void
}

function ClipboardWidget({ data, updateData }: WidgetComponentProps) {
  const [items, setItems] = useState<ClipboardItem[]>(() => (data.items as ClipboardItem[]) || [])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Sync to store when items change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateData({ items })
    }, 300)
    return () => clearTimeout(timer)
  }, [items])

  // Listen for Windows clipboard changes via Electron
  useEffect(() => {
    const api = window.electronAPI as ElectronClipboardAPI | undefined
    
    // Check if Electron API is available
    if (!api?.onClipboardChange) {
      console.log('Clipboard monitoring not available (not in Electron)')
      return
    }

    const unsubscribe = api.onClipboardChange((clipboardData) => {
      setItems(prev => {
        // Don't add duplicates (check by content)
        if (prev.some(item => item.content === clipboardData.content)) return prev
        
        const newItem: ClipboardItem = {
          id: Date.now().toString(),
          type: clipboardData.type,
          content: clipboardData.content,
          timestamp: Date.now(),
          preview: clipboardData.type === 'text' 
            ? clipboardData.content.slice(0, 100) 
            : clipboardData.content
        }
        return [newItem, ...prev].slice(0, 20) // Keep last 20 items
      })
    })

    return () => unsubscribe()
  }, [])

  const copyItem = async (item: ClipboardItem) => {
    try {
      const api = window.electronAPI as ElectronClipboardAPI | undefined
      
      if (api?.clipboardWriteText && api?.clipboardWriteImage) {
        // Use Electron clipboard API
        if (item.type === 'text') {
          api.clipboardWriteText(item.content)
        } else {
          api.clipboardWriteImage(item.content)
        }
      } else {
        // Fallback to browser API
        await navigator.clipboard.writeText(item.content)
      }
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const clearAll = () => {
    setItems([])
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="h-full flex flex-col bg-neutral-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <Clipboard size={14} className="text-neutral-500" />
          <span className="text-xs font-medium text-neutral-600">Clipboard</span>
          <span className="text-[10px] text-neutral-400">({items.length})</span>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="text-[10px] text-neutral-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-300">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-center p-4">
            <Clipboard size={28} className="mb-2 opacity-40" />
            <p className="text-xs">Clipboard history empty</p>
            <p className="text-[10px] mt-1 opacity-70">Copy something to see it here</p>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="group relative bg-white rounded-lg p-2 border border-neutral-200 hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-start gap-2">
                {/* Type icon */}
                <div className="mt-0.5 text-neutral-400">
                  {item.type === 'text' ? <FileText size={12} /> : <Image size={12} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {item.type === 'text' ? (
                    <p className="text-xs text-neutral-700 line-clamp-2 break-all">
                      {item.preview}
                    </p>
                  ) : (
                    <img
                      src={item.content}
                      alt="Clipboard image"
                      className="max-h-16 rounded object-cover"
                    />
                  )}
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    {formatTime(item.timestamp)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyItem(item)}
                    className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                    title="Copy"
                  >
                    {copiedId === item.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick paste hint */}
      <div className="px-3 py-1.5 bg-white border-t border-neutral-200 text-center">
        <span className="text-[10px] text-neutral-400">Auto-syncing with Windows clipboard</span>
      </div>
    </div>
  )
}

// Register this widget
registerWidget(clipboardWidgetConfig)

export default ClipboardWidget
