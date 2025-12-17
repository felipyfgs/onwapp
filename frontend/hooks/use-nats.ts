import { useEffect, useState } from 'react'
import { connect, JSONCodec, StringCodec } from 'nats.ws'

export const useNATS = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connection, setConnection] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)

  const NATS_URL = process.env.NEXT_PUBLIC_NATS_URL || 'ws://localhost:8222'

  const connectToNATS = async (subject: string, callback: (data: any) => void) => {
    try {
      // Connect to NATS server
      const nc = await connect({
        servers: NATS_URL,
        reconnect: true,
        maxReconnectAttempts: -1, // Infinite reconnect attempts
        reconnectTimeWait: 2000,
      })

      setConnection(nc)
      setIsConnected(true)
      setError(null)

      // Subscribe to subject
      const sub = nc.subscribe(subject)
      const sc = StringCodec()
      const jc = JSONCodec()

      ;(async () => {
        for await (const m of sub) {
          try {
            const data = jc.decode(m.data)
            callback(data)
          } catch (err) {
            console.error('Failed to decode message:', err)
          }
        }
      })()

      setSubscription(sub)
      return () => {
        // Cleanup
        if (sub) {
          sub.unsubscribe()
        }
        if (nc) {
          nc.close()
        }
      }

    } catch (err) {
      console.error('NATS connection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect to NATS')
      setIsConnected(false)
      return () => {} // Return empty cleanup function
    }
  }

  const publishMessage = async (subject: string, data: any) => {
    if (!connection) {
      throw new Error('Not connected to NATS')
    }

    try {
      const jc = JSONCodec()
      await connection.publish(subject, jc.encode(data))
    } catch (err) {
      console.error('Failed to publish message:', err)
      throw err
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (subscription) {
        subscription.unsubscribe()
      }
      if (connection) {
        connection.close()
      }
    }
  }, [subscription, connection])

  return {
    isConnected,
    error,
    connectToNATS,
    publishMessage,
  }
}
