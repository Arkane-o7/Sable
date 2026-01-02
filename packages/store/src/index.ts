import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createChatSlice, type ChatSlice } from './slices/chat'
import { createUserSlice, type UserSlice } from './slices/user'
import { createWorkspaceSlice, type WorkspaceSlice } from './slices/workspace'

// Combined store type
export type SableStore = ChatSlice & UserSlice & WorkspaceSlice

// Create the combined store
export const useSableStore = create<SableStore>()(
  persist(
    (...a) => ({
      ...createChatSlice(...a),
      ...createUserSlice(...a),
      ...createWorkspaceSlice(...a),
    }),
    {
      name: 'sable-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        preferences: state.preferences,
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    }
  )
)

// Export slices for individual use
export { createChatSlice, type ChatSlice } from './slices/chat'
export { createUserSlice, type UserSlice } from './slices/user'
export { createWorkspaceSlice, type WorkspaceSlice } from './slices/workspace'
