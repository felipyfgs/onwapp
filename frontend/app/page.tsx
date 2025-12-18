'use client'

import { ArrowRight, MessagesSquare, Users, Globe, Shield, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  const features = [
    {
      icon: MessagesSquare,
      title: 'Multi-tenant Messaging',
      description: 'Serve multiple businesses with isolated data and custom branding'
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Organize contacts, track interactions, and manage relationships'
    },
    {
      icon: Globe,
      title: 'Platform Agnostic',
      description: 'Support for WhatsApp, Telegram, Instagram and more'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'JWT authentication, multi-tenancy, and robust error handling'
    },
    {
      icon: Zap,
      title: 'Real-time Updates',
      description: 'NATS-powered messaging with instant notifications'
    }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Hero Section */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-600">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-black/40 rounded-full border border-white/20 dark:border-white/10 backdrop-blur-sm">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Multi-tenant Platform
                  </span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Customer Service Platform
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    {' '}Built for Scale
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
                  Onwapp is a modern, multi-tenant customer service platform inspired by WhatsApp Business API.
                  Built with Go, Next.js, and NATS for real-time communication across multiple platforms.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={feature.title}
                    className={`flex items-center gap-3 p-4 bg-white/60 dark:bg-black/40 rounded-xl border border-white/20 dark:border-white/10 animate-in fade-in slide-in-from-left-${index * 2} duration-600`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/login')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <a
                  href="https://github.com/your-repo/onwapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/80 dark:bg-black/40 text-slate-900 dark:text-white font-semibold rounded-lg border border-white/20 dark:border-white/10 hover:bg-white dark:hover:bg-black/60 transition-all duration-300 hover:scale-105"
                >
                  View on GitHub
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="relative animate-in fade-in zoom-in-95 duration-600" style={{ animationDelay: '0.3s' }}>
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-500 to-indigo-500">
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-white text-sm font-medium">Onwapp Dashboard</div>
                    <div className="w-24 h-4 bg-slate-300 dark:bg-slate-600 rounded animate-pulse"></div>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Chat Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">Customer Support</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">Active now</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-blue-50 dark:bg-blue-900/30 text-slate-900 dark:text-white p-3 rounded-lg max-w-xs">
                        Hello! How can we help you today?
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-lg max-w-xs ml-auto">
                        I need help with my account.
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span>Agent typing...</span>
                    </div>
                  </div>
                  
                  {/* Input */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <input 
                      type="text" 
                      placeholder="Type your message..."
                      className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-500"
                    />
                    <button className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl opacity-20 blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl opacity-20 blur-xl"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg"></div>
              <span className="font-semibold">Onwapp</span>
              <span className="text-sm">• Multi-tenant Customer Service Platform</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Built with ❤️ using Go, Next.js, and NATS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
