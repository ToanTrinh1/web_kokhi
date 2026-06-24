import { useCallback, useEffect, useState } from 'react'
import { Activity, CheckCircle, Server, Wifi, WifiOff } from 'lucide-react'
import Header from '../components/Header'
import { fetchSystemStatus } from '../services/stationApi'
import { getAqiColor } from '../services/stationApi'
import './SystemStatusPage.css'

function formatUptime(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function StatusBadge({ ok, label }) {
  return (
    <span className={`status-badge ${ok ? 'status-ok' : 'status-bad'}`}>
      {ok ? <CheckCircle size={14} /> : <Activity size={14} />}
      {label}
    </span>
  )
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchSystemStatus()
      setStatus(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [load])

  return (
    <main className="dashboard-main">
      <Header title="TRẠNG THÁI HỆ THỐNG" />

      {loading && !status && <div className="api-banner">Đang tải…</div>}
      {error && <div className="api-banner api-banner-error">{error}</div>}

      {status && (
        <>
          <div className="status-grid">
            <div className="status-card">
              <Server size={20} />
              <div>
                <div className="status-card-label">API</div>
                <StatusBadge ok={status.api_status === 'ok'} label={status.api_status.toUpperCase()} />
              </div>
            </div>
            <div className="status-card">
              <Activity size={20} />
              <div>
                <div className="status-card-label">Database</div>
                <StatusBadge ok={status.db_status === 'ok'} label={status.db_status.toUpperCase()} />
              </div>
            </div>
            <div className="status-card">
              <Wifi size={20} />
              <div>
                <div className="status-card-label">TRAM online</div>
                <div className="status-card-value">
                  {status.stations_online}/{status.stations_total}
                </div>
              </div>
            </div>
            <div className="status-card">
              <Activity size={20} />
              <div>
                <div className="status-card-label">Uptime</div>
                <div className="status-card-value">{formatUptime(status.uptime_sec)}</div>
              </div>
            </div>
          </div>

          <div className="status-meta">
            <span>Mode: <strong>{status.mode}</strong></span>
            <span>Readings hôm nay: <strong>{status.readings_today}</strong></span>
            <span>Alerts hôm nay: <strong>{status.alerts_today}</strong></span>
            <span>Offline sau: <strong>{status.stale_threshold_sec}s</strong> không có dữ liệu</span>
          </div>

          <div className="status-table-wrap">
            <table className="status-table">
              <thead>
                <tr>
                  <th>TRAM</th>
                  <th>Trạng thái</th>
                  <th>Lần cuối</th>
                  <th>PM2.5</th>
                  <th>AQI</th>
                </tr>
              </thead>
              <tbody>
                {status.stations.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>
                      <span className={`station-status ${s.online ? 'online' : 'offline'}`}>
                        {s.online ? <Wifi size={13} /> : <WifiOff size={13} />}
                        {s.online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td>
                      {s.last_seen
                        ? new Date(s.last_seen).toLocaleString('vi-VN')
                        : '—'}
                    </td>
                    <td>{s.last_pm25} µg/m³</td>
                    <td style={{ color: getAqiColor(s.last_aqi) }}>{s.last_aqi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}
