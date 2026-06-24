const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API ${res.status}`)
  }
  return res.json()
}

export function fetchStations() {
  return request('/api/stations')
}

export function fetchStationHistory(stationId, hours = 24) {
  return request(`/api/stations/${stationId}/history?hours=${hours}`)
}

export function fetchReadingLog(params = {}) {
  const q = new URLSearchParams()
  if (params.stationId) q.set('station_id', params.stationId)
  if (params.hours) q.set('hours', params.hours)
  if (params.limit) q.set('limit', params.limit)
  const qs = q.toString()
  return request(`/api/readings${qs ? `?${qs}` : ''}`)
}

export function fetchAlerts(params = {}) {
  const q = new URLSearchParams()
  if (params.stationId) q.set('station_id', params.stationId)
  if (params.hours) q.set('hours', params.hours)
  const qs = q.toString()
  return request(`/api/alerts${qs ? `?${qs}` : ''}`)
}

export function fetchSettings() {
  return request('/api/settings')
}

export function updateSettings(settings) {
  return request('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
}

export function fetchSystemStatus() {
  return request('/api/system/status')
}

export function fetchHeatmap(hours = 6) {
  return request(`/api/heatmap?hours=${hours}`)
}

export function fetchReadingStats(hours = 24) {
  return request(`/api/stats/readings?hours=${hours}`)
}

export function fetchForecast(steps = 6) {
  return request(`/api/forecast?steps=${steps}`)
}

export function testTelegram(chatId) {
  return request('/api/telegram/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId || '' }),
  })
}

export function wsStationsUrl() {
  const base = API_BASE.replace(/^http/, 'ws')
  return `${base}/ws/stations`
}

export function getAqiColor(aqi) {
  if (aqi <= 50) return '#4ade80'
  if (aqi <= 100) return '#facc15'
  return '#f87171'
}

export function alertLevelColor(level) {
  if (level === 'critical') return '#f87171'
  if (level === 'warning') return '#facc15'
  return null
}
