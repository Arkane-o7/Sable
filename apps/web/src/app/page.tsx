import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-2xl font-bold">S</span>
          </div>
          <h1 className="text-4xl font-bold">Sable</h1>
        </div>
        
        {/* Tagline */}
        <p className="text-xl text-neutral-400 max-w-md">
          AI-powered assistant for your daily workflow
        </p>
        
        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center">
          <Link 
            href="/chat"
            className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            Start Chatting
          </Link>
          <Link 
            href="https://github.com/Arkane-o7/Sable"
            className="px-6 py-3 bg-neutral-800 text-white rounded-lg font-medium hover:bg-neutral-700 transition-colors"
            target="_blank"
          >
            Download Desktop
          </Link>
        </div>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-3xl">
          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="font-semibold mb-2">Smart Chat</h3>
            <p className="text-sm text-neutral-400">Powered by LLaMA 3.3 70B for intelligent conversations</p>
          </div>
          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="text-2xl mb-3">🔍</div>
            <h3 className="font-semibold mb-2">Web Search</h3>
            <p className="text-sm text-neutral-400">Real-time information with integrated Tavily search</p>
          </div>
          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800">
            <div className="text-2xl mb-3">🖥️</div>
            <h3 className="font-semibold mb-2">Desktop App</h3>
            <p className="text-sm text-neutral-400">Always-on overlay for Windows and macOS</p>
          </div>
        </div>
      </div>
    </main>
  )
}
