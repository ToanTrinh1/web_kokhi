import { AlertTriangle } from 'lucide-react'
import './AlertBanner.css'

export default function AlertBanner({ alerts }) {
  if (!alerts?.length) return null
  const latest = alerts[0]

  return (
    <div className={`alert-banner alert-banner-${latest.level}`}>
      <AlertTriangle size={18} />
      <div>
        <strong>{latest.station_name}</strong> — {latest.message}
        <span className="alert-banner-time">
          {new Date(latest.created_at).toLocaleTimeString('vi-VN')}
        </span>
      </div>
    </div>
  )
}
