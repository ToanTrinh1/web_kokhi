import { useCallback, useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import Header from '../components/Header'
import { useTheme } from '../context/ThemeContext'
import { fetchHeatmap, fetchStations } from '../services/stationApi'
import 'leaflet/dist/leaflet.css'
import './HeatmapPage.css'

const CENTER = [10.778, 106.705]

function intensityColor(value, max = 100) {
  const t = Math.min(value / max, 1)
  if (t < 0.33) return '#4ade80'
  if (t < 0.66) return '#facc15'
  return '#f87171'
}

function HeatLayer({ points, metric }) {
  return points.map((p, i) => {
    const value = metric === 'aqi' ? p.aqi : p.pm25
    const radius = 80 + value * 2
    const color = intensityColor(value)
    return (
      <Circle
        key={`${p.station_id}-${p.recorded_at}-${i}`}
        center={[p.lat, p.lng]}
        radius={radius}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.35,
          weight: 1,
          opacity: 0.5,
        }}
      >
        <Tooltip>
          <strong>{p.station_name}</strong>
          <br />
          PM2.5: {p.pm25.toFixed(1)} | AQI: {p.aqi}
          <br />
          {new Date(p.recorded_at).toLocaleString('vi-VN')}
        </Tooltip>
      </Circle>
    )
  })
}

export default function HeatmapPage() {
  const { theme } = useTheme()
  const [hours, setHours] = useState('6')
  const [metric, setMetric] = useState('pm25')
  const [points, setPoints] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const tileUrl = theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  const load = useCallback(async () => {
    try {
      const [heatmap, st] = await Promise.all([
        fetchHeatmap(Number(hours)),
        fetchStations(),
      ])
      setPoints(heatmap)
      setStations(st)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [hours])

  useEffect(() => {
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [load])

  const displayPoints = useMemo(() => {
    if (points.length > 0) return points
    return stations.map((s) => ({
      lat: s.lat,
      lng: s.lng,
      pm25: s.pm25,
      aqi: s.aqi,
      station_id: s.id,
      station_name: s.name,
      recorded_at: new Date().toISOString(),
    }))
  }, [points, stations])

  return (
    <main className="dashboard-main">
      <Header title="BẢN ĐỒ NHIỆT Ô NHIỄM" />

      <div className="heatmap-toolbar">
        <select value={hours} onChange={(e) => setHours(e.target.value)}>
          <option value="1">1 giờ</option>
          <option value="6">6 giờ</option>
          <option value="24">24 giờ</option>
          <option value="168">7 ngày</option>
        </select>
        <select value={metric} onChange={(e) => setMetric(e.target.value)}>
          <option value="pm25">PM2.5</option>
          <option value="aqi">AQI</option>
        </select>
        <span className="heatmap-count">{displayPoints.length} điểm dữ liệu</span>
      </div>

      {error && <div className="api-banner api-banner-error">{error}</div>}
      {loading && <div className="api-banner">Đang tải…</div>}

      <div className="heatmap-map-wrap">
        <MapContainer center={CENTER} zoom={14} className="heatmap-map" scrollWheelZoom>
          <TileLayer attribution="" url={tileUrl} />
          <HeatLayer points={displayPoints} metric={metric} />
        </MapContainer>
        <div className="heatmap-legend">
          <div className="legend-title">{metric === 'aqi' ? 'AQI' : 'PM2.5'} intensity</div>
          <div className="legend-bar" />
          <div className="legend-labels">
            <span>Thấp</span>
            <span>Cao</span>
          </div>
        </div>
      </div>
    </main>
  )
}
