import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { MoreVertical } from 'lucide-react'
import { tempHumChartData } from '../data/mockData'
import './ChartCard.css'

const chartStyle = {
  fontSize: 11,
  fill: '#64748b',
}

export default function TempHumChart() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-title">Temp/Humidity</h3>
        <button type="button" className="chart-menu-btn" aria-label="More options">
          <MoreVertical size={16} />
        </button>
      </div>
      <div className="chart-legend-custom">
        <span className="legend-line" style={{ color: '#f87171' }}>● Nhiệt độ</span>
        <span className="legend-line" style={{ color: '#facc15' }}>● T2</span>
        <span className="legend-line" style={{ color: '#4ade80' }}>● Độ ẩm</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={tempHumChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#252b3d" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" tick={chartStyle} axisLine={false} tickLine={false} />
          <YAxis tick={chartStyle} axisLine={false} tickLine={false} domain={[15, 40]} />
          <Tooltip
            contentStyle={{
              background: '#161b28',
              border: '1px solid #252b3d',
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Line type="monotone" dataKey="temp" stroke="#f87171" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="t2" stroke="#facc15" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="humidity" stroke="#4ade80" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
