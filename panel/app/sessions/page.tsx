export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">OnWapp Sessions</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Create New Session
            </button>
          </div>
        </div>
      </header>

      <main className="container flex-1 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Your Sessions</h2>
            <p className="text-muted-foreground">
              Manage your WhatsApp sessions and connections
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex items-center gap-4">
          <input
            type="search"
            placeholder="Search sessions..."
            className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option>All Status</option>
            <option>Connected</option>
            <option>Disconnected</option>
            <option>Connecting</option>
          </select>
        </div>

        {/* Session Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder Session Card */}
          <a
            href="/sessions/default"
            className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary">
                  Session Name
                </h3>
                <p className="text-sm text-muted-foreground">default</p>
              </div>
              <div className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600">
                Connected
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>0 messages</span>
              <span>0 contacts</span>
            </div>
          </a>

          {/* Add more placeholder cards */}
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No sessions found
              </p>
              <button className="mt-2 text-sm font-medium text-primary hover:underline">
                Create your first session
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
