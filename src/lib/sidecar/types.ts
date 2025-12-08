// Sidecar Types - Shared interfaces for all sidecars

export interface SidecarNotification {
  id: string
  appId: string
  appName: string
  title: string
  message: string
  timestamp: number
  icon?: string // Base64 encoded
  actions?: {
    id: string
    label: string
  }[]
}

export interface SidecarSearchResult {
  path: string
  name: string
  type: 'file' | 'folder' | 'app'
  icon?: string
  size?: number
  modified?: number
}

export interface SidecarCommand {
  type: 'start' | 'stop' | 'search' | 'action' | 'dismiss'
  payload?: Record<string, unknown>
}

export interface SidecarResponse {
  type: 'notification' | 'search-results' | 'error' | 'ready' | 'stopped'
  payload: unknown
}

// Map Windows app IDs to our notification sources
export const APP_ID_MAP: Record<string, string> = {
  'Microsoft.Teams': 'teams',
  'Microsoft.Outlook': 'outlook',
  'WhatsApp': 'whatsapp',
  'Slack': 'slack',
  'Discord': 'discord',
  'Google.Chrome': 'gmail', // Gmail notifications via Chrome
  'Microsoft.Edge': 'gmail',
  'com.twitter': 'twitter',
}
