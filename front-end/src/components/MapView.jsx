import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { stations } from '../data/mockData'
import './MapView.css'

const markerIcon = (color, label) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin" style="background:${color}">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

export default function MapView() {
  const center = [10.778, 106.705]

  return (
    <div className="map-card">
      <MapContainer center={center} zoom={14} className="map-container" scrollWheelZoom={false}>
        <TileLayer
          attribution=""
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
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
