import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { MoreVertical } from 'lucide-react'
import { getStationPmChartData } from '../data/mockData'
import './ChartCard.css'

const chartStyle = {
  fontSize: 11,
  fill: 'var(--text-muted)',
}

function mergeChartData(history, forecast) {
  const base = history?.length ? [...history] : []
  if (!forecast?.points?.length) return base

  const last = base[base.length - 1]
  const bridge = last
    ? [{ ...last, pm25_forecast: last.pm25 }]
    : []

  const future = forecast.points.map((p) => ({
    time: p.time,
    pm25_forecast: p.pm25,
    forecast: true,
  }))

  return [...base, ...bridge, ...future]
}

export default function PMChart({ station, chartData, forecast }) {
  const raw = chartData?.length ? chartData : getStationPmChartData(station.id)
  const data = mergeChartData(raw, forecast)
  const accent = station.color || '#4ade80'
  const hasForecast = forecast?.sufficient_data && forecast?.points?.length

  return (
    <div className="chart-card chart-card-station">
      <div className="chart-card-header">
        <div>
          <h3 className="chart-title">PM2.5/PM10 concentration</h3>
          <p className="chart-station-label">{station.name}</p>
        </div>
        <button type="button" className="chart-menu-btn" aria-label="More options">
          <MoreVertical size={16} />
        </button>
      </div>
      <div className="chart-legend-custom">
        <span className="legend-line" style={{ color: accent }}>● PM2.5</span>
        <span className="legend-line" style={{ color: '#facc15' }}>● PM10</span>
        {hasForecast && (
          <span className="legend-line" style={{ color: '#60a5fa' }}>┄ Dự báo PM2.5</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" tick={chartStyle} axisLine={false} tickLine={false} />
          <YAxis tick={chartStyle} axisLine={false} tickLine={false} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ display: 'none' }} />
          <Line
            type="monotone"
            dataKey="pm25"
            stroke={accent}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive
            animationDuration={400}
          />
          <Line
            type="monotone"
            dataKey="pm10"
            stroke="#facc15"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={400}
          />
          {hasForecast && (
            <Line
              type="monotone"
              dataKey="pm25_forecast"
              stroke="#60a5fa"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
