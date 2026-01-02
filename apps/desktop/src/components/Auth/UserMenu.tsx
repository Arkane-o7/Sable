import { useState, useRef, useEffect } from 'react'
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const displayName = user.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user.email

  const initials = user.firstName 
    ? `${user.firstName[0]}${user.lastName?.[0] || ''}`
    : user.email[0].toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        {user.profilePictureUrl ? (
          <img 
            src={user.profilePictureUrl} 
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
            {initials}
          </div>
        )}
        <span className="text-sm text-white font-medium max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-neutral-800 rounded-xl shadow-2xl border border-neutral-700/50 overflow-hidden z-50">
          <div className="p-3 border-b border-neutral-700/50">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-neutral-400 truncate">{user.email}</p>
          </div>
          
          <div className="p-1">
            <button
              onClick={() => {
                setIsOpen(false)
                // Could add profile page navigation here
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700/50 rounded-lg transition-colors"
            >
              <UserIcon className="w-4 h-4" />
              Profile
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false)
                signOut()
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
