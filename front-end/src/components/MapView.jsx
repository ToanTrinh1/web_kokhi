import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../context/ThemeContext'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

const markerIcon = (color, label) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin" style="background:${color}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

export default function MapView({ stations = [] }) {
  const { theme } = useTheme()
  const center = [10.778, 106.705]
  const tileUrl = theme === 'light'
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

  return (
    <div className="map-card">
      <MapContainer center={center} zoom={14} className="map-container" scrollWheelZoom={false}>
        <TileLayer attribution="" url={tileUrl} />
        {stations.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={markerIcon(s.color, s.id)}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              AQI: {s.aqi} ({s.aqiLabel})
              <br />
              {s.online ? 'ONLINE' : 'OFFLINE'}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="map-legend">
        <div className="legend-title">AQI</div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#4ade80' }} />
          Good
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#facc15' }} />
          Moderate
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#f87171' }} />
          Red
        </div>
      </div>
    </div>
  )
}
