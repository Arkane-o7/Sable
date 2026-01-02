import { useState, useEffect } from 'react'
import { WidgetComponentProps, WidgetConfig } from './types'
import { registerWidget } from './registry'

// ============= Widget Configuration =============
export const stickyNoteWidgetConfig: WidgetConfig = {
  type: 'sticky-note',
  label: 'Sticky Note',
  defaultSize: { width: 200, height: 180 },
  minSize: { width: 140, height: 100 },
  component: StickyNoteWidget,
}

// ============= Constants =============
const COLORS = [
  { name: 'yellow', bg: 'bg-amber-200', text: 'text-amber-900', placeholder: 'placeholder-amber-400' },
  { name: 'pink', bg: 'bg-pink-200', text: 'text-pink-900', placeholder: 'placeholder-pink-400' },
  { name: 'blue', bg: 'bg-sky-200', text: 'text-sky-900', placeholder: 'placeholder-sky-400' },
  { name: 'green', bg: 'bg-emerald-200', text: 'text-emerald-900', placeholder: 'placeholder-emerald-400' },
  { name: 'purple', bg: 'bg-violet-200', text: 'text-violet-900', placeholder: 'placeholder-violet-400' },
  { name: 'orange', bg: 'bg-orange-200', text: 'text-orange-900', placeholder: 'placeholder-orange-400' },
]

// ============= Widget Component =============
function StickyNoteWidget({ data, isEditMode, updateData }: WidgetComponentProps) {
  const [content, setContent] = useState((data.content as string) || '')
  const [colorIndex, setColorIndex] = useState((data.colorIndex as number) || 0)
  
  const currentColor = COLORS[colorIndex % COLORS.length]
  
  // Update store when content changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateData({ content, colorIndex })
    }, 300)
    
    return () => clearTimeout(timer)
  }, [content, colorIndex, updateData])

  return (
    <div className={`h-full flex flex-col ${currentColor.bg} rounded-xl shadow-sm`}>
      {/* Color picker (only visible in edit mode) */}
      {isEditMode && (
        <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-black/5">
          {COLORS.map((color, index) => (
            <button
              key={color.name}
              onClick={() => setColorIndex(index)}
              className={`w-4 h-4 rounded-full ${color.bg} ring-2 ring-offset-1 ${
                index === colorIndex ? 'ring-neutral-600' : 'ring-transparent'
              } transition-all hover:scale-110`}
            />
          ))}
        </div>
      )}
      
      {/* Note content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a note..."
        className={`flex-1 w-full p-3 bg-transparent ${currentColor.text} ${currentColor.placeholder} text-sm resize-none focus:outline-none leading-relaxed`}
        style={{ minHeight: 0 }}
      />
    </div>
  )
}

// Register this widget
registerWidget(stickyNoteWidgetConfig)

export default StickyNoteWidget
