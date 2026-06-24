import { useCallback, useEffect, useState } from 'react'
import { fetchAlerts, fetchForecast, fetchStationHistory, fetchStations } from '../services/stationApi'
import { useMockSimulator } from './useMockSimulator'
import { useStationWebSocket } from './useStationWebSocket'

const POLL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 3000
const CHART_HOURS = Number(import.meta.env.VITE_CHART_HOURS) || 2
const USE_API = import.meta.env.VITE_USE_API !== 'false'
const USE_WS = import.meta.env.VITE_USE_WEBSOCKET !== 'false'

function useApiStations() {
  const [stations, setStations] = useState([])
  const [histories, setHistories] = useState({})
  const [forecasts, setForecasts] = useState([])
  const [forecastByStation, setForecastByStation] = useState({})
  const [alerts, setAlerts] = useState([])
  const [alertByStation, setAlertByStation] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      const [data, alertList, forecastList] = await Promise.all([
        fetchStations(),
        fetchAlerts({ hours: 2 }),
        fetchForecast(6),
      ])
      setStations(data)
      setAlerts(alertList)
      setForecasts(forecastList)
      setError(null)

      const byStation = {}
      alertList.forEach((a) => {
        if (!byStation[a.station_id] || a.level === 'critical') {
          byStation[a.station_id] = a.level
        }
      })
      setAlertByStation(byStation)
      setForecastByStation(Object.fromEntries(forecastList.map((f) => [f.station_id, f])))

      const historyEntries = await Promise.all(
        data.map(async (s) => {
          const points = await fetchStationHistory(s.id, CHART_HOURS)
          return [s.id, points]
        }),
      )
      setHistories(Object.fromEntries(historyEntries))
    } catch (err) {
      setError(err.message || 'Failed to load stations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [load])

  useStationWebSocket(USE_WS ? (data) => {
    setStations(data)
    setError(null)
  } : null)

  return {
    stations,
    histories,
    forecasts,
    forecastByStation,
    alerts,
    alertByStation,
    loading,
    error,
    refresh: load,
    useApi: true,
  }
}

export function useStations() {
  const mock = useMockSimulator(POLL_MS)
  const api = useApiStations()

  if (!USE_API) {
    const alertByStation = {}
    mock.stations.forEach((s) => {
      if (s.pm25 >= 55) alertByStation[s.id] = 'critical'
      else if (s.pm25 >= 35) alertByStation[s.id] = 'warning'
    })
    return { ...mock, alerts: [], forecasts: [], forecastByStation: {}, alertByStation, refresh: () => {} }
  }
  return api
}
