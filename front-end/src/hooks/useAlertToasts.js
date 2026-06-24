import { useEffect, useRef } from 'react'
import { useToast } from '../context/ToastContext'

export function useAlertToasts(alerts, enabled = true) {
  const { pushToast } = useToast()
  const seenRef = useRef(new Set())
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !alerts?.length) return

    if (!initializedRef.current) {
      alerts.forEach((a) => seenRef.current.add(String(a.id)))
      initializedRef.current = true
      return
    }

    alerts.forEach((a) => {
      const key = String(a.id)
      if (seenRef.current.has(key)) return
      seenRef.current.add(key)
      if (seenRef.current.size > 200) {
        seenRef.current = new Set([...seenRef.current].slice(-100))
      }
      pushToast({
        title: a.station_name,
        message: a.message,
        level: a.level,
      })
    })
  }, [alerts, pushToast, enabled])
}
