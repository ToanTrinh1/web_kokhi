import { useCallback, useEffect, useState } from 'react'
import { getAqiColor } from '../services/stationApi'
import { stations as initialStations } from '../data/mockData'

function randomDelta(max) {
  return (Math.random() - 0.5) * max
}

function nextReading(station, now) {
  const hour = now.getHours()
  let rush = 1
  if (hour >= 6 && hour <= 9) rush = 1.2
  if (hour >= 17 && hour <= 20) rush = 1.1

  const pm25 = Math.max(2, station.pm25 + randomDelta(3) * rush)
  const pm10 = Math.max(pm25 * 1.3, station.pm25 * 1.6 + randomDelta(4) * rush)
  const temp = Math.max(20, Math.min(38, station.temp + randomDelta(0.6)))
  const humidity = Math.max(30, Math.min(95, station.humidity + randomDelta(2)))
  const aqi = Math.round(pm25)
  const timeLabel = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  return {
    station: {
      ...station,
      pm25: Math.round(pm25 * 10) / 10,
      temp: Math.round(temp * 10) / 10,
      humidity: Math.round(humidity * 10) / 10,
      aqi,
      aqiLabel: aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : 'Unhealthy',
      color: getAqiColor(aqi),
      time: now.toLocaleTimeString('vi-VN', { hour12: false }),
      online: true,
      gauges: [
        { type: 'PM2.5', value: Math.min(100, aqi), max: 100 },
        { type: 'PM10', value: Math.min(100, Math.round(pm10)), max: 100 },
        { type: 'AQI', value: aqi, max: 100 },
      ],
    },
    chartPoint: {
      time: timeLabel,
      pm25: Math.round(pm25),
      pm10: Math.round(pm10),
    },
  }
}

const MAX_POINTS = 60

export function useMockSimulator(intervalMs = 3000) {
  const [stations, setStations] = useState(initialStations)
  const [histories, setHistories] = useState(() => {
    const init = {}
    initialStations.forEach((s) => {
      init[s.id] = [
        { time: '00:00', pm25: Math.round(s.pm25), pm10: Math.round(s.pm25 * 1.5) },
      ]
    })
    return init
  })

  const tick = useCallback(() => {
    const now = new Date()
    setStations((prev) => {
      const nextStations = []
      const historyPatch = {}

      prev.forEach((s) => {
        const { station, chartPoint } = nextReading(s, now)
        nextStations.push(station)
        historyPatch[s.id] = chartPoint
      })

      setHistories((h) => {
        const next = { ...h }
        Object.entries(historyPatch).forEach(([id, point]) => {
          const list = [...(next[id] || []), point]
          next[id] = list.slice(-MAX_POINTS)
        })
        return next
      })

      return nextStations
    })
  }, [])

  useEffect(() => {
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [tick, intervalMs])

  return { stations, histories, loading: false, error: null, useApi: false }
}
