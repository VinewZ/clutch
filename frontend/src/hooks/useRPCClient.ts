import { useState, useEffect } from 'react'
import { createClient } from "../../../../clutchRPC/ts"
import { ClutchServices } from '../../bindings/github.com/vinewz/clutch/app'

export function useRPCClient() {
  const [client, setClient] = useState<ReturnType<typeof createClient> | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    ClutchServices.GetRPCServerPort()
      .then((port) => {
        if (!isMounted) return
        const c = createClient(port)
        setClient(c)
      })
      .catch((e) => {
        if (!isMounted) return
        setError(e)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return { client, error }
}
