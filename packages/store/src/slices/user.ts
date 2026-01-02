import type { StateCreator } from 'zustand'
import type { User, UserPreferences } from '@sable/types'

export interface UserSlice {
  // State
  user: User | null
  preferences: UserPreferences
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setPreferences: (preferences: Partial<UserPreferences>) => void
  logout: () => void
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  defaultModel: 'llama-3.3-70b-versatile',
  shortcuts: {},
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  // Initial state
  user: null,
  preferences: defaultPreferences,
  isAuthenticated: false,

  // Actions
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setPreferences: (preferences) =>
    set((state) => ({
      preferences: { ...state.preferences, ...preferences },
    })),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      preferences: defaultPreferences,
    }),
})
