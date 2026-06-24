import StationGaugeBox from './StationGaugeBox'
import PMChart from './PMChart'
import './StationSection.css'

export default function StationSection({ station, chartData, forecast }) {
  return (
    <article className="station-section">
      <div className="station-section-left">
        <StationGaugeBox station={station} />
      </div>
      <div className="station-section-right">
        <PMChart station={station} chartData={chartData} forecast={forecast} />
      </div>
    </article>
  )
}
