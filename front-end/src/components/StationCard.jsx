import { Wifi, AlertTriangle } from 'lucide-react'
import { getAqiColor, alertLevelColor } from '../services/stationApi'
import './StationCard.css'

export default function StationCard({ station, alertLevel }) {
  const aqiColor = getAqiColor(station.aqi)
  const alertColor = alertLevelColor(alertLevel)

  return (
    <div className={`station-card ${alertLevel ? `station-card-${alertLevel}` : ''} ${!station.online ? 'station-card-offline' : ''}`}>
      <div className="station-card-header">
        <div>
          <div className="station-name">{station.name}</div>
          <div className="station-subtitle">{station.subtitle}</div>
        </div>
        <div className="station-card-badges">
          {alertLevel && (
            <span className="station-alert-badge" style={{ color: alertColor, borderColor: alertColor }}>
              <AlertTriangle size={12} />
              {alertLevel === 'critical' ? 'NGUY HIỂM' : 'CẢNH BÁO'}
            </span>
          )}
          <div className="station-online">
            <Wifi size={14} />
            <span className={station.online ? '' : 'text-offline'}>
              {station.online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>
      <div className="station-time">{station.time}</div>
      <div className="station-metrics">
        <div className="metric">
          <span className="metric-label">AQI:</span>
          <span className="metric-value" style={{ color: aqiColor }}>
            {station.aqi} ({station.aqiLabel})
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">PM2.5:</span>
          <span className="metric-value">{station.pm25} µg/m³</span>
        </div>
        <div className="metric">
          <span className="metric-label">Temp/Hum:</span>
          <span className="metric-value">
            {station.temp}°C / {station.humidity}%
          </span>
        </div>
      </div>
    </div>
  )
}
