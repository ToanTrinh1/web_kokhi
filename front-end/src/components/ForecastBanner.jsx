import { TrendingUp } from 'lucide-react'
import './ForecastBanner.css'

export default function ForecastBanner({ forecasts }) {
  const warnings = forecasts?.filter((f) => f.will_exceed_warning && f.sufficient_data) || []
  const withAdvice = forecasts?.filter((f) => f.health_advice && f.sufficient_data) || []
  const top = warnings.sort((a, b) => (a.hours_until_warning ?? 99) - (b.hours_until_warning ?? 99))[0]
    || withAdvice[0]

  if (!top) return null

  return (
    <div className="forecast-banner">
      <TrendingUp size={18} />
      <div>
        {top.will_exceed_warning ? (
          <strong>Dự báo sớm — {top.station_name}</strong>
        ) : (
          <strong>Khuyến nghị sức khỏe — {top.station_name}</strong>
        )}
        <span>{top.message}</span>
        {top.health_advice && <span className="health-advice">{top.health_advice}</span>}
      </div>
    </div>
  )
}
