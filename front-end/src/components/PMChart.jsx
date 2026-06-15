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
import { pmChartData } from '../data/mockData'
import './ChartCard.css'

const chartStyle = {
  fontSize: 11,
  fill: '#64748b',
}

export default function PMChart() {
  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <h3 className="chart-title">PM2.5/PM10 concentration</h3>
        <button type="button" className="chart-menu-btn" aria-label="More options">
          <MoreVertical size={16} />
        </button>
      </div>
      <div className="chart-legend-custom">
        <span className="legend-line" style={{ color: '#4ade80' }}>● T1</span>
        <span className="legend-line" style={{ color: '#facc15' }}>● T2</span>
        <span className="legend-line" style={{ color: '#f87171' }}>● T3</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={pmChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#252b3d" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="time" tick={chartStyle} axisLine={false} tickLine={false} />
          <YAxis tick={chartStyle} axisLine={false} tickLine={false} domain={[0, 180]} />
          <Tooltip
            contentStyle={{
              background: '#161b28',
              border: '1px solid #252b3d',
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ display: 'none' }} />
          <Line type="monotone" dataKey="t1" stroke="#4ade80" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="t2" stroke="#facc15" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="t3" stroke="#f87171" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
