import { Wifi } from 'lucide-react'
import GaugeChart from './GaugeChart'
import './StationGaugeBox.css'

export default function StationGaugeBox({ station }) {
  return (
    <div className="station-gauge-box">
      <div className="station-gauge-box-header">
        <div>
          <div className="station-gauge-box-title">{station.name}</div>
          <div className="station-gauge-box-subtitle">{station.subtitle}</div>
        </div>
        <div className="station-gauge-box-online">
          <Wifi size={13} />
          <span>ONLINE</span>
        </div>
      </div>
      <div className="station-gauge-box-gauges">
        {station.gauges.map((gauge) => (
          <GaugeChart
            key={gauge.type}
            type={gauge.type}
            value={gauge.value}
            max={gauge.max}
            gradientId={`grad-${station.id}-${gauge.type}`}
          />
        ))}
      </div>
    </div>
  )
}
