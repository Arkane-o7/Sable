import { WidgetConfig, WidgetType } from './types'

// Widget registry - maps widget types to their configurations
const widgetRegistry = new Map<WidgetType, WidgetConfig>()

/**
 * Register a widget configuration
 * Call this when defining a new widget
 */
export function registerWidget(config: WidgetConfig): void {
  widgetRegistry.set(config.type, config)
}

/**
 * Get a widget configuration by type
 */
export function getWidgetConfig(type: WidgetType): WidgetConfig | undefined {
  return widgetRegistry.get(type)
}

/**
 * Get all registered widget configurations
 * Used for the "Add Widget" menu
 */
export function getAllWidgetConfigs(): WidgetConfig[] {
  return Array.from(widgetRegistry.values())
}

/**
 * Get default size for a widget type
 */
export function getWidgetDefaultSize(type: WidgetType): { width: number; height: number } {
  const config = widgetRegistry.get(type)
  return config?.defaultSize ?? { width: 220, height: 200 }
}

/**
 * Get minimum size for a widget type
 */
export function getWidgetMinSize(type: WidgetType): { width: number; height: number } {
  const config = widgetRegistry.get(type)
  return config?.minSize ?? { width: 150, height: 100 }
}

/**
 * Check if a widget type is registered
 */
export function isWidgetRegistered(type: WidgetType): boolean {
  return widgetRegistry.has(type)
}
