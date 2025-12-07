import { NextRequest } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session: string }> }
) {
  const { session } = await params
  const auth = request.nextUrl.searchParams.get('auth')

  if (!auth) {
    return new Response('Unauthorized', { status: 401 })
  }

  const backendUrl = `${API_URL}/sse/${session}/events?auth=${encodeURIComponent(auth)}`

  try {
    const response = await fetch(backendUrl, {
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      return new Response(`Backend error: ${response.status}`, { status: response.status })
    }

    // Create a TransformStream to proxy the SSE
    const { readable, writable } = new TransformStream()
    
    // Pipe the backend response to the client
    response.body?.pipeTo(writable).catch(() => {
      // Connection closed
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('[SSE Proxy] Error:', error)
    return new Response('Failed to connect to backend', { status: 502 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
