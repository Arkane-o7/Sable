import { SignIn, useUser } from '@clerk/clerk-react'
import { useEffect } from 'react'

export function AuthPage() {
  const { isSignedIn } = useUser()

  // When user signs in, notify main window and close
  useEffect(() => {
    if (isSignedIn) {
      window.electronAPI?.notifyAuthSuccess()
      window.electronAPI?.closeAuthWindow()
    }
  }, [isSignedIn])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="w-full max-w-md p-8">
        {/* Logo and Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
            <span className="text-3xl font-bold text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Sign in to Sable</h1>
          <p className="text-neutral-400 text-sm">Your AI-powered desktop assistant</p>
        </div>

        {/* Clerk Sign In */}
        <div className="flex justify-center">
          <SignIn 
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-neutral-800/80 backdrop-blur-xl border border-neutral-700/50 shadow-2xl rounded-xl',
                headerTitle: 'text-white',
                headerSubtitle: 'text-neutral-400',
                formButtonPrimary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
                formFieldInput: 'bg-neutral-700 border-neutral-600 text-white placeholder:text-neutral-400',
                formFieldLabel: 'text-neutral-300',
                footerActionLink: 'text-blue-400 hover:text-blue-300',
                identityPreviewText: 'text-white',
                identityPreviewEditButton: 'text-blue-400',
                socialButtonsBlockButton: 'bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600',
                socialButtonsBlockButtonText: 'text-white',
                dividerLine: 'bg-neutral-600',
                dividerText: 'text-neutral-400',
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
