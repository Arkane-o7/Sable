import { useUser, useClerk } from '@clerk/clerk-react'

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  profilePictureUrl: string | null
}

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut, openSignIn } = useClerk()

  const transformedUser: User | null = user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    firstName: user.firstName,
    lastName: user.lastName,
    profilePictureUrl: user.imageUrl,
  } : null

  return {
    user: transformedUser,
    isLoading: !isLoaded,
    isAuthenticated: !!isSignedIn,
    signIn: openSignIn,
    signOut: () => signOut(),
  }
}
