import { useCallback, useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import Header from '../components/Header'
import { fetchAlerts, fetchReadingLog } from '../services/stationApi'
import { downloadCsv, formatLogForCsv } from '../utils/exportCsv'
import { alertLevelColor } from '../services/stationApi'
import './HistoryPage.css'

const STATIONS = [
  { id: '', label: 'Tất cả TRAM' },
  { id: '1', label: 'TRAM 1' },
  { id: '2', label: 'TRAM 2' },
  { id: '3', label: 'TRAM 3' },
]

export default function HistoryPage() {
  const [stationId, setStationId] = useState('')
  const [hours, setHours] = useState('24')
  const [tab, setTab] = useState('readings')
  const [readings, setReadings] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { hours: Number(hours), limit: 300 }
      if (stationId) params.stationId = stationId
      const [log, alertList] = await Promise.all([
        fetchReadingLog(params),
        fetchAlerts(params),
      ])
      setReadings(log)
      setAlerts(alertList)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [stationId, hours])

  useEffect(() => {
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [load])

  const handleExport = () => {
    const rows = tab === 'readings' ? formatLogForCsv(readings) : alerts.map((a) => ({
      tram: a.station_name,
      thoi_gian: new Date(a.created_at).toLocaleString('vi-VN'),
      chi_so: a.metric,
      muc: a.level,
      gia_tri: a.value,
      noi_dung: a.message,
    }))
    downloadCsv(`kokhi-${tab}-${Date.now()}.csv`, rows)
  }

  return (
    <main className="dashboard-main">
      <Header title="LỊCH SỬ DỮ LIỆU & CẢNH BÁO" showExport onExport={handleExport} />

      <div className="history-toolbar">
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
        <div className="history-tabs">
          <button type="button" className={tab === 'readings' ? 'active' : ''} onClick={() => setTab('readings')}>
            Measurements ({readings.length})
          </button>
          <button type="button" className={tab === 'alerts' ? 'active' : ''} onClick={() => setTab('alerts')}>
            Alerts ({alerts.length})
          </button>
        </div>
        <button type="button" className="btn-export-sm" onClick={handleExport}>
          <Download size={14} /> CSV
        </button>
      </div>

      {error && <div className="api-banner api-banner-error">{error}</div>}
      {loading && <div className="api-banner">Đang tải…</div>}

      <div className="history-table-wrap">
        {tab === 'readings' ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>TRAM</th>
                <th>PM2.5</th>
                <th>PM10</th>
                <th>AQI</th>
                <th>Temp</th>
                <th>Humidity</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.recorded_at).toLocaleString('vi-VN')}</td>
                  <td>{r.station_name}</td>
                  <td>{r.pm25}</td>
                  <td>{r.pm10}</td>
                  <td>{r.aqi}</td>
                  <td>{r.temp}°C</td>
                  <td>{r.humidity}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>TRAM</th>
                <th>Chỉ số</th>
                <th>Mức</th>
                <th>Giá trị</th>
                <th>Nội dung</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.created_at).toLocaleString('vi-VN')}</td>
                  <td>{a.station_name}</td>
                  <td>{a.metric.toUpperCase()}</td>
                  <td style={{ color: alertLevelColor(a.level) }}>{a.level}</td>
                  <td>{a.value}</td>
                  <td>{a.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && tab === 'readings' && readings.length === 0 && (
          <p className="history-empty">Không có dữ liệu trong khoảng thời gian đã chọn.</p>
        )}
        {!loading && tab === 'alerts' && alerts.length === 0 && (
          <p className="history-empty">Không có cảnh báo — chất lượng không khí ổn định.</p>
        )}
      </div>
    </main>
  )
}
