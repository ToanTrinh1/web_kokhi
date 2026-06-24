import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Download } from 'lucide-react'
import Header from '../components/Header'
import {
  fetchReadingLog,
  fetchReadingStats,
  fetchStationHistory,
  getAqiColor,
} from '../services/stationApi'
import { downloadCsv, formatLogForCsv } from '../utils/exportCsv'
import './DetailedDataPage.css'

const STATIONS = [
  { id: '', label: 'Tất cả TRAM' },
  { id: '1', label: 'TRAM 1' },
  { id: '2', label: 'TRAM 2' },
  { id: '3', label: 'TRAM 3' },
]

const COLORS = ['#4ade80', '#facc15', '#60a5fa']

function mergeCompareHistories(h1, h2, h3) {
  const maxLen = Math.max(h1.length, h2.length, h3.length)
  const out = []
  for (let i = 0; i < maxLen; i++) {
    out.push({
      time: h1[i]?.time || h2[i]?.time || h3[i]?.time || `${i}`,
      tram1: h1[i]?.pm25 ?? null,
      tram2: h2[i]?.pm25 ?? null,
      tram3: h3[i]?.pm25 ?? null,
    })
  }
  return out
}

export default function DetailedDataPage() {
  const [hours, setHours] = useState('24')
  const [stationId, setStationId] = useState('')
  const [stats, setStats] = useState([])
  const [readings, setReadings] = useState([])
  const [compareData, setCompareData] = useState([])
  const [sortKey, setSortKey] = useState('recorded_at')
  const [sortDir, setSortDir] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const h = Number(hours)
      const params = { hours: h, limit: 500 }
      if (stationId) params.stationId = stationId

      const [statList, log, hist1, hist2, hist3] = await Promise.all([
        fetchReadingStats(h),
        fetchReadingLog(params),
        fetchStationHistory(1, h),
        fetchStationHistory(2, h),
        fetchStationHistory(3, h),
      ])
      setStats(statList)
      setReadings(log)
      setCompareData(mergeCompareHistories(hist1, hist2, hist3))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [hours, stationId])

  useEffect(() => {
    load()
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [load])

  const sortedRows = useMemo(() => {
    const rows = [...readings]
    rows.sort((a, b) => {
      let va = a[sortKey]
      let vb = b[sortKey]
      if (sortKey === 'recorded_at') {
        va = new Date(va).getTime()
        vb = new Date(vb).getTime()
      }
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return rows
  }, [readings, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'recorded_at' ? 'desc' : 'asc')
    }
  }

  const handleExport = () => downloadCsv(`kokhi-detailed-${Date.now()}.csv`, formatLogForCsv(readings))

  const sortIndicator = (key) => (sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '')

  return (
    <main className="dashboard-main">
      <Header title="DỮ LIỆU CHI TIẾT & THỐNG KÊ" showExport onExport={handleExport} />

      <div className="detailed-toolbar">
        <select value={stationId} onChange={(e) => setStationId(e.target.value)}>
          {STATIONS.map((s) => (
            <option key={s.id || 'all'} value={s.id}>{s.label}</option>
          ))}
        </select>
        <select value={hours} onChange={(e) => setHours(e.target.value)}>
          <option value="1">1 giờ</option>
          <option value="6">6 giờ</option>
          <option value="24">24 giờ</option>
          <option value="168">7 ngày</option>
        </select>
        <button type="button" className="btn-export-sm" onClick={handleExport}>
          <Download size={14} /> CSV
        </button>
      </div>

      {error && <div className="api-banner api-banner-error">{error}</div>}
      {loading && !stats.length && <div className="api-banner">Đang tải…</div>}

      <section className="stats-grid">
        {stats.map((s) => (
          <div key={s.station_id} className="stats-card">
            <h3>{s.station_name}</h3>
            <p className="stats-count">{s.count} measurements</p>
            <div className="stats-metrics">
              <div>
                <span className="stats-label">PM2.5</span>
                <span>{s.pm25_min} – {s.pm25_max} <em>(avg {s.pm25_avg})</em></span>
              </div>
              <div>
                <span className="stats-label">PM10</span>
                <span>{s.pm10_min} – {s.pm10_max} <em>(avg {s.pm10_avg})</em></span>
              </div>
              <div>
                <span className="stats-label">AQI</span>
                <span style={{ color: getAqiColor(s.aqi_avg) }}>
                  {s.aqi_min} – {s.aqi_max} <em>(avg {s.aqi_avg})</em>
                </span>
              </div>
              <div>
                <span className="stats-label">Temp</span>
                <span>{s.temp_min}° – {s.temp_max}° <em>(avg {s.temp_avg}°)</em></span>
              </div>
              <div>
                <span className="stats-label">Humidity</span>
                <span>{s.humidity_min}% – {s.humidity_max}% <em>(avg {s.humidity_avg}%)</em></span>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="compare-chart-section">
        <h2>So sánh PM2.5 — 3 TRAM</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={compareData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="tram1" name="TRAM 1" stroke={COLORS[0]} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tram2" name="TRAM 2" stroke={COLORS[1]} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="tram3" name="TRAM 3" stroke={COLORS[2]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <div className="detailed-table-wrap">
        <table className="detailed-table">
          <thead>
            <tr>
              {[
                ['recorded_at', 'Thời gian'],
                ['station_name', 'TRAM'],
                ['pm25', 'PM2.5'],
                ['pm10', 'PM10'],
                ['aqi', 'AQI'],
                ['temp', 'Temp'],
                ['humidity', 'Humidity'],
              ].map(([key, label]) => (
                <th key={key}>
                  <button type="button" className="sort-btn" onClick={() => toggleSort(key)}>
                    {label}{sortIndicator(key)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.recorded_at).toLocaleString('vi-VN')}</td>
                <td>{r.station_name}</td>
                <td>{r.pm25}</td>
                <td>{r.pm10}</td>
                <td style={{ color: getAqiColor(r.aqi) }}>{r.aqi}</td>
                <td>{r.temp}°C</td>
                <td>{r.humidity}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && sortedRows.length === 0 && (
          <p className="detailed-empty">Không có dữ liệu.</p>
        )}
      </div>
    </main>
  )
}
