import { useEffect, useRef } from 'react'
import { wsStationsUrl } from '../services/stationApi'

export function useStationWebSocket(onMessage) {
  const cbRef = useRef(onMessage)
  cbRef.current = onMessage

  useEffect(() => {
    if (!onMessage) return undefined
    let ws
    let closed = false
    let retry

    const connect = () => {
      if (closed) return
      try {
        ws = new WebSocket(wsStationsUrl())
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            if (msg.type === 'stations' && Array.isArray(msg.data)) {
              cbRef.current?.(msg.data)
            }
          } catch {
            /* ignore */
          }
        }
        ws.onclose = () => {
          if (!closed) retry = setTimeout(connect, 3000)
        }
      } catch {
        retry = setTimeout(connect, 3000)
      }
    }
    connect()
    return () => {
      closed = true
      clearTimeout(retry)
      ws?.close()
    }
  }, [onMessage])
}
