import { ComponentType } from 'react'

// Widget types - add new widget types here
export type WidgetType = 'chat' | 'sticky-note' | 'todo' | 'weather' | 'clipboard' | 'calendar' | 'notifications'

// Props that every widget component receives
export interface WidgetComponentProps {
  widgetId: string
  workspaceId: string
  data: Record<string, unknown>
  isEditMode: boolean
  updateData: (data: Record<string, unknown>) => void
}

// Widget configuration - each widget defines this
export interface WidgetConfig {
  type: WidgetType
  label: string
  defaultSize: { width: number; height: number }
  minSize: { width: number; height: number }
  component: ComponentType<WidgetComponentProps>
}

// Runtime widget instance (stored in workspace)
export interface WidgetInstance {
  id: string
  type: WidgetType
  position: { x: number; y: number }
  size: { width: number; height: number }
  data: Record<string, unknown>
}
