import { Wifi } from 'lucide-react'
import { getAqiColor } from '../data/mockData'
import './StationCard.css'

export default function StationCard({ station }) {
  const aqiColor = getAqiColor(station.aqi)

  return (
    <div className="station-card">
      <div className="station-card-header">
        <div>
          <div className="station-name">{station.name}</div>
          <div className="station-subtitle">{station.subtitle}</div>
        </div>
        <div className="station-online">
          <Wifi size={12} />
          <span>ONLINE</span>
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
