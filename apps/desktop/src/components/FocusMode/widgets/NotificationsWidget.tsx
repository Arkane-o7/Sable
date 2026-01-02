import { useState, useEffect, useMemo } from 'react'
import { Bell, Check, CheckCheck, Trash2, Mail, MessageCircle, Users, AtSign, ChevronDown, ChevronRight } from 'lucide-react'
import { WidgetComponentProps, WidgetConfig } from './types'
import { registerWidget } from './registry'
import { motion, AnimatePresence } from 'framer-motion'

// ============= Widget Configuration =============
export const notificationsWidgetConfig: WidgetConfig = {
  type: 'notifications',
  label: 'Notifications',
  defaultSize: { width: 320, height: 400 },
  minSize: { width: 280, height: 300 },
  component: NotificationsWidget,
}

// ============= Types =============
type NotificationSource = 'whatsapp' | 'gmail' | 'twitter' | 'teams' | 'outlook' | 'slack' | 'discord'

interface Notification {
  id: string
  source: NotificationSource
  title: string
  message: string
  sender?: string
  avatar?: string
  timestamp: number
  read: boolean
  actionUrl?: string
}

interface GroupedNotifications {
  source: NotificationSource
  notifications: Notification[]
  unreadCount: number
  latestTimestamp: number
}

// ============= Source Config =============
const SOURCE_CONFIG: Record<NotificationSource, { 
  name: string
  color: string
  bgColor: string
  icon: React.ReactNode
}> = {
  whatsapp: { 
    name: 'WhatsApp', 
    color: '#25D366', 
    bgColor: 'bg-green-500',
    icon: <MessageCircle size={12} />
  },
  gmail: { 
    name: 'Gmail', 
    color: '#EA4335', 
    bgColor: 'bg-red-500',
    icon: <Mail size={12} />
  },
  twitter: { 
    name: 'X', 
    color: '#000000', 
    bgColor: 'bg-black',
    icon: <AtSign size={12} />
  },
  teams: { 
    name: 'Teams', 
    color: '#6264A7', 
    bgColor: 'bg-indigo-500',
    icon: <Users size={12} />
  },
  outlook: { 
    name: 'Outlook', 
    color: '#0078D4', 
    bgColor: 'bg-blue-500',
    icon: <Mail size={12} />
  },
  slack: { 
    name: 'Slack', 
    color: '#4A154B', 
    bgColor: 'bg-purple-700',
    icon: <MessageCircle size={12} />
  },
  discord: { 
    name: 'Discord', 
    color: '#5865F2', 
    bgColor: 'bg-indigo-500',
    icon: <MessageCircle size={12} />
  },
}

// ============= Mock Notifications =============
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    source: 'whatsapp',
    title: 'John Doe',
    message: 'Hey! Are we still meeting today?',
    sender: 'John Doe',
    timestamp: Date.now() - 2 * 60 * 1000,
    read: false,
  },
  {
    id: '1b',
    source: 'whatsapp',
    title: 'Mom',
    message: "Don't forget dinner tonight at 7!",
    sender: 'Mom',
    timestamp: Date.now() - 5 * 60 * 1000,
    read: false,
  },
  {
    id: '1c',
    source: 'whatsapp',
    title: 'Work Group',
    message: 'Sarah: The client meeting is moved to 3pm',
    sender: 'Work Group',
    timestamp: Date.now() - 10 * 60 * 1000,
    read: false,
  },
  {
    id: '2',
    source: 'gmail',
    title: 'Project Update',
    message: 'The quarterly report is ready for your review...',
    sender: 'sarah@company.com',
    timestamp: Date.now() - 15 * 60 * 1000,
    read: false,
  },
  {
    id: '2b',
    source: 'gmail',
    title: 'Newsletter',
    message: 'Your weekly digest is here!',
    sender: 'news@techweekly.com',
    timestamp: Date.now() - 45 * 60 * 1000,
    read: true,
  },
  {
    id: '3',
    source: 'teams',
    title: 'Design Team',
    message: 'New message in #design-reviews channel',
    sender: 'Mike Chen',
    timestamp: Date.now() - 30 * 60 * 1000,
    read: false,
  },
  {
    id: '4',
    source: 'twitter',
    title: '@techguru mentioned you',
    message: 'Check out this amazing project by @you...',
    sender: '@techguru',
    timestamp: Date.now() - 60 * 60 * 1000,
    read: true,
  },
  {
    id: '5',
    source: 'slack',
    title: '#general',
    message: 'Team standup in 10 minutes!',
    sender: 'SlackBot',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    read: true,
  },
]

// ============= Helper Functions =============
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}

// Map app names from Windows to our notification sources
function getSourceFromAppName(appName: string): NotificationSource {
  const lower = appName.toLowerCase()
  
  if (lower.includes('whatsapp')) return 'whatsapp'
  if (lower.includes('slack')) return 'slack'
  if (lower.includes('discord')) return 'discord'
  if (lower.includes('teams')) return 'teams'
  if (lower.includes('outlook') || lower.includes('mail')) return 'outlook'
  if (lower.includes('gmail') || lower.includes('chrome') || lower.includes('edge')) return 'gmail'
  if (lower.includes('twitter') || lower.includes(' x ')) return 'twitter'
  
  // Default to outlook for unknown apps (most generic)
  return 'outlook'
}

// ============= Widget Component =============
function NotificationsWidget({ data, updateData }: WidgetComponentProps) {
  const [notifications, setNotifications] = useState<Notification[]>(() => 
    (data.notifications as Notification[]) || MOCK_NOTIFICATIONS
  )
  const [expandedGroups, setExpandedGroups] = useState<Set<NotificationSource>>(new Set(['whatsapp']))
  const [isListening, setIsListening] = useState(false)
  
  // Start notification listener on mount
  useEffect(() => {
    const electronAPI = (window as any).electronAPI
    if (!electronAPI?.startNotificationListener) {
      console.log('Notification listener not available (not in Electron)')
      return
    }
    
    // Start the listener
    electronAPI.startNotificationListener().then(() => {
      setIsListening(true)
      console.log('Notification listener started')
    }).catch((err: Error) => {
      console.error('Failed to start notification listener:', err)
    })
    
    // Listen for system notifications
    const unsubscribe = electronAPI.onSystemNotification?.((sysNotif: {
      id: string
      appId: string
      appName: string
      title: string
      message: string
      timestamp: number
    }) => {
      console.log('Received system notification:', sysNotif)
      
      const notification: Notification = {
        id: `sys-${sysNotif.id}`,
        source: getSourceFromAppName(sysNotif.appName),
        title: sysNotif.title,
        message: sysNotif.message,
        sender: sysNotif.appName,
        timestamp: sysNotif.timestamp,
        read: false,
      }
      
      setNotifications(prev => {
        // Don't add duplicates
        if (prev.some(n => n.id === notification.id)) return prev
        return [notification, ...prev].slice(0, 50) // Keep max 50 notifications
      })
    })
    
    return () => {
      unsubscribe?.()
      electronAPI.stopNotificationListener?.()
    }
  }, [])
  
  // Sync to store
  useEffect(() => {
    const timer = setTimeout(() => {
      updateData({ notifications })
    }, 300)
    return () => clearTimeout(timer)
  }, [notifications, updateData])
  
  // Group notifications by source
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, GroupedNotifications> = {}
    
    notifications.forEach(n => {
      if (!groups[n.source]) {
        groups[n.source] = {
          source: n.source,
          notifications: [],
          unreadCount: 0,
          latestTimestamp: 0
        }
      }
      groups[n.source].notifications.push(n)
      if (!n.read) groups[n.source].unreadCount++
      if (n.timestamp > groups[n.source].latestTimestamp) {
        groups[n.source].latestTimestamp = n.timestamp
      }
    })
    
    // Sort groups by latest timestamp
    return Object.values(groups).sort((a, b) => b.latestTimestamp - a.latestTimestamp)
  }, [notifications])
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  const toggleGroup = (source: NotificationSource) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(source)) {
        next.delete(source)
      } else {
        next.add(source)
      }
      return next
    })
  }
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }
  
  const markGroupAsRead = (source: NotificationSource) => {
    setNotifications(prev => 
      prev.map(n => n.source === source ? { ...n, read: true } : n)
    )
  }
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }
  
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
  
  const clearGroup = (source: NotificationSource) => {
    setNotifications(prev => prev.filter(n => n.source !== source))
  }
  
  const clearAll = () => {
    setNotifications([])
  }
  
  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-neutral-600" />
            <span className="text-xs font-medium text-neutral-700">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
            {/* Status indicator */}
            <div 
              className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-green-500' : 'bg-neutral-300'}`}
              title={isListening ? 'Listening for notifications' : 'Not connected'}
            />
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-1.5 rounded hover:bg-neutral-200 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={12} className="text-neutral-600" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Grouped Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {groupedNotifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400 p-4">
            <Bell size={32} className="mb-2 opacity-40" />
            <p className="text-xs">No notifications</p>
            <p className="text-[10px] mt-1 opacity-70">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {groupedNotifications.map(group => {
              const sourceConfig = SOURCE_CONFIG[group.source]
              const isExpanded = expandedGroups.has(group.source)
              
              return (
                <div key={group.source} className="bg-white">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.source)}
                    className={`w-full px-3 py-2 flex items-center gap-2.5 hover:bg-neutral-50 transition-colors ${
                      group.unreadCount > 0 ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Source icon */}
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${sourceConfig.bgColor}`}
                    >
                      {sourceConfig.icon}
                    </div>
                    
                    {/* Group info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-neutral-800">
                          {sourceConfig.name}
                        </span>
                        {group.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-medium bg-blue-500 text-white rounded-full">
                            {group.unreadCount}
                          </span>
                        )}
                        <span className="text-[9px] text-neutral-400 ml-auto mr-1">
                          {formatTimeAgo(group.latestTimestamp)}
                        </span>
                      </div>
                      
                      {/* Preview of latest message when collapsed */}
                      {!isExpanded && (
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {group.notifications[0].title}: {group.notifications[0].message}
                        </p>
                      )}
                    </div>
                    
                    {/* Expand/collapse icon */}
                    <div className="text-neutral-400">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                  </button>
                  
                  {/* Expanded Messages */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-12 pr-3 pb-2 space-y-0.5">
                          {group.notifications.map(notification => (
                            <div
                              key={notification.id}
                              className={`group relative flex items-start gap-2 p-2 rounded-lg hover:bg-neutral-100 transition-colors ${
                                !notification.read ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              {/* Unread dot */}
                              {!notification.read && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                              )}
                              
                              {/* Message content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-neutral-700 truncate">
                                    {notification.title}
                                  </span>
                                  <span className="text-[9px] text-neutral-400 flex-shrink-0">
                                    {formatTimeAgo(notification.timestamp)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-500 truncate">
                                  {notification.message}
                                </p>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id) }}
                                    className="p-1 rounded hover:bg-neutral-200 transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check size={10} className="text-neutral-500" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}
                                  className="p-1 rounded hover:bg-red-100 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={10} className="text-neutral-400 hover:text-red-500" />
                                </button>
                              </div>
                            </div>
                          ))}
                          
                          {/* Group actions */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-100 mt-1">
                            {group.unreadCount > 0 && (
                              <button
                                onClick={() => markGroupAsRead(group.source)}
                                className="text-[10px] text-neutral-400 hover:text-neutral-600 transition-colors"
                              >
                                Mark all read
                              </button>
                            )}
                            <button
                              onClick={() => clearGroup(group.source)}
                              className="text-[10px] text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-3 py-2 border-t border-neutral-200 bg-neutral-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {Object.entries(SOURCE_CONFIG).slice(0, 4).map(([key, config]) => (
              <div
                key={key}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-white opacity-40 ${config.bgColor}`}
                title={`${config.name} - Not connected`}
              >
                {config.icon}
              </div>
            ))}
            <span className="text-[9px] text-neutral-400 ml-1">+3 more</span>
          </div>
          <button
            onClick={clearAll}
            className="text-[10px] text-neutral-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  )
}

// Register this widget
registerWidget(notificationsWidgetConfig)

export default NotificationsWidget
