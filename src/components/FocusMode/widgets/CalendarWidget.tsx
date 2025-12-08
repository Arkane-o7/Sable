import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { WidgetComponentProps, WidgetConfig } from './types'
import { registerWidget } from './registry'
import { motion, AnimatePresence } from 'framer-motion'

// ============= Widget Configuration =============
export const calendarWidgetConfig: WidgetConfig = {
  type: 'calendar',
  label: 'Calendar',
  defaultSize: { width: 300, height: 380 },
  minSize: { width: 260, height: 320 },
  component: CalendarWidget,
}

// ============= Types =============
interface CalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM
  color: string
  source?: 'local' | 'google' | 'outlook' | 'slack'
}

// ============= Constants =============
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const EVENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// ============= Helper Functions =============
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isToday(year: number, month: number, day: number): boolean {
  const today = new Date()
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
}

// ============= Widget Component =============
function CalendarWidget({ data, updateData }: WidgetComponentProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventTime, setNewEventTime] = useState('')
  const [newEventColor, setNewEventColor] = useState(EVENT_COLORS[0])
  
  const events = (data.events as CalendarEvent[]) || []
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const days: (number | null)[] = []
    
    // Add empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    return days
  }, [year, month])
  
  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}
    events.forEach(event => {
      if (!grouped[event.date]) {
        grouped[event.date] = []
      }
      grouped[event.date].push(event)
    })
    return grouped
  }, [events])
  
  const navigateMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  const handleDayClick = (day: number) => {
    const dateKey = formatDateKey(year, month, day)
    setSelectedDate(dateKey)
  }
  
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle.trim() || !selectedDate) return
    
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: newEventTitle.trim(),
      date: selectedDate,
      time: newEventTime || undefined,
      color: newEventColor,
      source: 'local'
    }
    
    updateData({ events: [...events, newEvent] })
    setNewEventTitle('')
    setNewEventTime('')
    setShowEventForm(false)
  }
  
  const handleDeleteEvent = (eventId: string) => {
    updateData({ events: events.filter(e => e.id !== eventId) })
  }
  
  const selectedDateEvents = selectedDate ? eventsByDate[selectedDate] || [] : []
  
  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1 rounded hover:bg-neutral-200 transition-colors"
          >
            <ChevronLeft size={16} className="text-neutral-600" />
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1 rounded hover:bg-neutral-200 transition-colors"
          >
            <ChevronRight size={16} className="text-neutral-600" />
          </button>
          <span className="text-sm font-medium text-neutral-800 ml-1">
            {MONTHS[month]} {year}
          </span>
        </div>
        <button
          onClick={goToToday}
          className="text-[10px] px-2 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-700 transition-colors"
        >
          Today
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div className="flex-1 p-2 overflow-hidden flex flex-col">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-[10px] font-medium text-neutral-400 py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5 flex-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }
            
            const dateKey = formatDateKey(year, month, day)
            const dayEvents = eventsByDate[dateKey] || []
            const isTodayDate = isToday(year, month, day)
            const isSelected = selectedDate === dateKey
            
            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-start p-0.5 transition-colors relative ${
                  isSelected
                    ? 'bg-blue-100 ring-2 ring-blue-500'
                    : isTodayDate
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-neutral-100'
                }`}
              >
                <span className={`text-[11px] font-medium ${
                  isTodayDate && !isSelected ? 'text-white' : 'text-neutral-700'
                }`}>
                  {day}
                </span>
                
                {/* Event indicators */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Selected Date Panel */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-neutral-200 bg-neutral-50 overflow-hidden"
          >
            <div className="p-2">
              {/* Date header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon size={12} className="text-neutral-500" />
                  <span className="text-xs font-medium text-neutral-700">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowEventForm(!showEventForm)}
                    className="p-1 rounded hover:bg-neutral-200 transition-colors"
                  >
                    <Plus size={14} className="text-neutral-600" />
                  </button>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="p-1 rounded hover:bg-neutral-200 transition-colors"
                  >
                    <X size={14} className="text-neutral-400" />
                  </button>
                </div>
              </div>
              
              {/* Add event form */}
              <AnimatePresence>
                {showEventForm && (
                  <motion.form
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    onSubmit={handleAddEvent}
                    className="mb-2 overflow-hidden"
                  >
                    <div className="space-y-2 p-2 bg-white rounded-lg border border-neutral-200">
                      <input
                        type="text"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        placeholder="Event title..."
                        autoFocus
                        className="w-full text-xs px-2 py-1.5 rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 flex-1">
                          <Clock size={12} className="text-neutral-400" />
                          <input
                            type="time"
                            value={newEventTime}
                            onChange={(e) => setNewEventTime(e.target.value)}
                            className="text-xs px-1.5 py-1 rounded border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex gap-1">
                          {EVENT_COLORS.map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewEventColor(color)}
                              className={`w-4 h-4 rounded-full transition-transform ${
                                newEventColor === color ? 'scale-125 ring-2 ring-offset-1 ring-neutral-300' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full text-xs py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        Add Event
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
              
              {/* Events list */}
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {selectedDateEvents.map(event => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-neutral-200 group"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-neutral-700 truncate block">{event.title}</span>
                        {event.time && (
                          <span className="text-[10px] text-neutral-400">{event.time}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-100 transition-all"
                      >
                        <X size={12} className="text-neutral-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : !showEventForm && (
                <p className="text-[10px] text-neutral-400 text-center py-2">No events</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Integration status footer (placeholder for future) */}
      <div className="px-3 py-1.5 border-t border-neutral-200 bg-white">
        <div className="flex items-center justify-center gap-2">
          <span className="text-[9px] text-neutral-400">Local calendar</span>
          {/* Future: Show connected services icons */}
        </div>
      </div>
    </div>
  )
}

// Register this widget
registerWidget(calendarWidgetConfig)

export default CalendarWidget
