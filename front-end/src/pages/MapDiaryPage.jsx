import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { Pause, Play } from 'lucide-react'
import Header from '../components/Header'
import { useTheme } from '../context/ThemeContext'
import { fetchHeatmap, getAqiColor } from '../services/stationApi'
import 'leaflet/dist/leaflet.css'
import './MapDiaryPage.css'

const CENTER = [10.778, 106.705]

const markerIcon = (color, label) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin" style="background:${color}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

function buildTimeline(points) {
  const byTime = new Map()
  points.forEach((p) => {
    const key = p.recorded_at
    if (!byTime.has(key)) byTime.set(key, [])
    byTime.get(key).push(p)
  })
  return [...byTime.entries()]
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([time, snapshot]) => ({ time, snapshot }))
}

export default function MapDiaryPage() {
  const { theme } = useTheme()
  const [hours, setHours] = useState('6')
  const [points, setPoints] = useState([])
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const playRef = useRef(null)

  const tileUrl = theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  const load = useCallback(async () => {
    try {
      const data = await fetchHeatmap(Number(hours))
      setPoints(data)
      setFrame(0)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [hours])

  useEffect(() => {
    load()
  }, [load])

  const timeline = useMemo(() => buildTimeline(points), [points])
  const current = timeline[frame] || null

  useEffect(() => {
    if (!playing || timeline.length < 2) return
    playRef.current = setInterval(() => {
      setFrame((f) => (f + 1 >= timeline.length ? 0 : f + 1))
    }, 800)
    return () => clearInterval(playRef.current)
  }, [playing, timeline.length])

  useEffect(() => {
    if (timeline.length > 0 && frame >= timeline.length) {
      setFrame(timeline.length - 1)
    }
  }, [timeline.length, frame])

  return (
    <main className="dashboard-main map-diary-main">
      <Header title="MAP DIARY — LỊCH SỬ TRÊN BẢN ĐỒ" />

      <div className="map-diary-toolbar">
        <select value={hours} onChange={(e) => { setHours(e.target.value); setPlaying(false) }}>
          <option value="1">1 giờ</option>
          <option value="6">6 giờ</option>
          <option value="24">24 giờ</option>
        </select>
        <button
          type="button"
          className="map-diary-play"
          onClick={() => setPlaying((p) => !p)}
          disabled={timeline.length < 2}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Dừng' : 'Phát'}
        </button>
        <span className="map-diary-meta">
          {timeline.length} mốc thời gian · {points.length} điểm
        </span>
      </div>

      {error && <div className="api-banner api-banner-error">{error}</div>}
      {loading && <div className="api-banner">Đang tải…</div>}

      <div className="map-diary-layout">
        <div className="map-diary-map-wrap">
          <MapContainer center={CENTER} zoom={14} className="map-diary-map" scrollWheelZoom>
            <TileLayer attribution="" url={tileUrl} />
            {current?.snapshot.map((p) => (
              <Marker
                key={p.station_id}
                position={[p.lat, p.lng]}
                icon={markerIcon(getAqiColor(p.aqi), p.station_id)}
              >
                <Popup>
                  <strong>{p.station_name}</strong>
                  <br />
                  PM2.5: {p.pm25.toFixed(1)} µg/m³
                  <br />
                  AQI: {p.aqi}
                  <br />
                  {new Date(p.recorded_at).toLocaleString('vi-VN')}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          {current && (
            <div className="map-diary-time-badge">
              {new Date(current.time).toLocaleString('vi-VN')}
            </div>
          )}
        </div>

        <aside className="map-diary-sidebar">
          <h3>Timeline</h3>
          <input
            type="range"
            min={0}
            max={Math.max(0, timeline.length - 1)}
            value={frame}
            onChange={(e) => { setFrame(Number(e.target.value)); setPlaying(false) }}
            className="map-diary-slider"
            disabled={timeline.length === 0}
          />
          <ul className="map-diary-list">
            {timeline.slice().reverse().slice(0, 50).map((item, i) => {
              const idx = timeline.length - 1 - i
              const avgAqi = Math.round(
                item.snapshot.reduce((s, p) => s + p.aqi, 0) / item.snapshot.length,
              )
              return (
                <li key={item.time}>
                  <button
                    type="button"
                    className={idx === frame ? 'active' : ''}
                    onClick={() => { setFrame(idx); setPlaying(false) }}
                  >
                    <span>{new Date(item.time).toLocaleTimeString('vi-VN')}</span>
                    <span style={{ color: getAqiColor(avgAqi) }}>AQI ~{avgAqi}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
      </div>
    </main>
  )
}
