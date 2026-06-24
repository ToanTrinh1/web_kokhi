export function downloadCsv(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','),
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function formatLogForCsv(log) {
  return log.map((r) => ({
    tram: r.station_name,
    thoi_gian: new Date(r.recorded_at).toLocaleString('vi-VN'),
    pm25: r.pm25,
    pm10: r.pm10,
    aqi: r.aqi,
    nhiet_do: r.temp,
    do_am: r.humidity,
  }))
}
