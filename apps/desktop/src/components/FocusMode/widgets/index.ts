// Widget System Exports
export * from './types'
export * from './registry'

// Import all widgets to trigger their registration
// Add new widget imports here - they self-register on import
import './ChatWidget'
import './StickyNoteWidget'
import './WeatherWidget'
import './ClipboardWidget'
import './CalendarWidget'
import './NotificationsWidget'

// Re-export widget components for direct use if needed
export { default as ChatWidget } from './ChatWidget'
export { default as StickyNoteWidget } from './StickyNoteWidget'
export { default as WeatherWidget } from './WeatherWidget'
export { default as ClipboardWidget } from './ClipboardWidget'
export { default as CalendarWidget } from './CalendarWidget'
export { default as NotificationsWidget } from './NotificationsWidget'
