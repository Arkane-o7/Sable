import type { StateCreator } from 'zustand'
import type { Workspace, Widget, Position, Size, WidgetType } from '@sable/types'
import { generateId } from '@sable/utils'

export interface WorkspaceSlice {
  // State
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  
  // Actions
  addWorkspace: (name: string) => string
  removeWorkspace: (id: string) => void
  setActiveWorkspace: (id: string) => void
  renameWorkspace: (id: string, name: string) => void
  
  // Widget actions
  addWidget: (workspaceId: string, type: WidgetType, position?: Position, size?: Size) => string
  removeWidget: (workspaceId: string, widgetId: string) => void
  updateWidgetPosition: (workspaceId: string, widgetId: string, position: Position) => void
  updateWidgetSize: (workspaceId: string, widgetId: string, size: Size) => void
  updateWidgetData: (workspaceId: string, widgetId: string, data: Record<string, unknown>) => void
}

const DEFAULT_WIDGET_SIZES: Record<WidgetType, Size> = {
  chat: { width: 400, height: 500 },
  'sticky-note': { width: 250, height: 250 },
  todo: { width: 300, height: 400 },
  weather: { width: 250, height: 150 },
  clipboard: { width: 300, height: 400 },
  calendar: { width: 300, height: 350 },
  notifications: { width: 350, height: 400 },
}

export const createWorkspaceSlice: StateCreator<WorkspaceSlice> = (set, get) => ({
  // Initial state
  workspaces: [],
  activeWorkspaceId: null,

  // Workspace actions
  addWorkspace: (name) => {
    const id = generateId()
    set((state) => ({
      workspaces: [...state.workspaces, { id, name, widgets: [] }],
      activeWorkspaceId: id,
    }))
    return id
  },

  removeWorkspace: (id) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      activeWorkspaceId:
        state.activeWorkspaceId === id
          ? state.workspaces[0]?.id || null
          : state.activeWorkspaceId,
    })),

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  renameWorkspace: (id, name) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id ? { ...w, name } : w
      ),
    })),

  // Widget actions
  addWidget: (workspaceId, type, position, size) => {
    const widgetId = generateId()
    const defaultSize = DEFAULT_WIDGET_SIZES[type]
    
    const newWidget: Widget = {
      id: widgetId,
      type,
      position: position || { x: 100, y: 100 },
      size: size || defaultSize,
      data: {},
    }

    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, widgets: [...w.widgets, newWidget] }
          : w
      ),
    }))
    
    return widgetId
  },

  removeWidget: (workspaceId, widgetId) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, widgets: w.widgets.filter((widget) => widget.id !== widgetId) }
          : w
      ),
    })),

  updateWidgetPosition: (workspaceId, widgetId, position) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              widgets: w.widgets.map((widget) =>
                widget.id === widgetId ? { ...widget, position } : widget
              ),
            }
          : w
      ),
    })),

  updateWidgetSize: (workspaceId, widgetId, size) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              widgets: w.widgets.map((widget) =>
                widget.id === widgetId ? { ...widget, size } : widget
              ),
            }
          : w
      ),
    })),

  updateWidgetData: (workspaceId, widgetId, data) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              widgets: w.widgets.map((widget) =>
                widget.id === widgetId
                  ? { ...widget, data: { ...widget.data, ...data } }
                  : widget
              ),
            }
          : w
      ),
    })),
})
