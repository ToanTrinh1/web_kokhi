export const stations = [
  {
    id: 1,
    name: 'TRAM 1',
    subtitle: 'TRAM DO',
    online: true,
    time: '14:35:10',
    aqi: 24,
    aqiLabel: 'Good',
    pm25: 11.2,
    temp: 26.5,
    humidity: 65,
    gaugeType: 'PM2.5',
    gaugeValue: 24,
    lat: 10.782,
    lng: 106.698,
    color: '#4ade80',
  },
  {
    id: 2,
    name: 'TRAM 2',
    subtitle: 'TRAM DO',
    online: true,
    time: '14:35:10',
    aqi: 58,
    aqiLabel: 'Moderate',
    pm25: 28.4,
    temp: 28.1,
    humidity: 58,
    gaugeType: 'PM10',
    gaugeValue: 58,
    lat: 10.788,
    lng: 106.712,
    color: '#facc15',
  },
  {
    id: 3,
    name: 'TRAM 3',
    subtitle: 'TRAM DO',
    online: true,
    time: '14:35:10',
    aqi: 42,
    aqiLabel: 'Good',
    pm25: 19.6,
    temp: 27.3,
    humidity: 62,
    gaugeType: 'PM10',
    gaugeValue: 42,
    lat: 10.768,
    lng: 106.705,
    color: '#4ade80',
  },
]

export const pmChartData = [
  { time: '14 hr', t1: 45, t2: 72, t3: 55 },
  { time: '24 hr', t1: 38, t2: 95, t3: 48 },
  { time: '08 hr', t1: 52, t2: 110, t3: 62 },
  { time: '14:00', t1: 28, t2: 88, t3: 40 },
  { time: '05 hr', t1: 65, t2: 130, t3: 75 },
  { time: '8 hr', t1: 42, t2: 78, t3: 50 },
]

export const tempHumChartData = [
  { time: '14 hr', temp: 28, t2: 30, humidity: 62 },
  { time: '24 hr', temp: 26, t2: 29, humidity: 68 },
  { time: '08 hr', temp: 32, t2: 34, humidity: 55 },
  { time: '14:00', temp: 30, t2: 31, humidity: 60 },
  { time: '05 hr', temp: 24, t2: 27, humidity: 72 },
  { time: '8 hr', temp: 29, t2: 30, humidity: 58 },
]

export function getAqiColor(aqi) {
  if (aqi <= 50) return '#4ade80'
  if (aqi <= 100) return '#facc15'
  return '#f87171'
}
