import Header from '../components/Header'
import StationCard from '../components/StationCard'
import MapView from '../components/MapView'
import StationSection from '../components/StationSection'
import AlertBanner from '../components/AlertBanner'
import ForecastBanner from '../components/ForecastBanner'
import { useStations } from '../hooks/useStations'
import { useAlertToasts } from '../hooks/useAlertToasts'
import '../App.css'

export default function OverviewPage() {
  const { stations, histories, forecasts, forecastByStation, alerts, alertByStation, loading, error, useApi } = useStations()
  useAlertToasts(alerts, useApi)

  return (
    <main className="dashboard-main">
      <Header title="TỔNG QUAN HỆ THỐNG GIÁM SÁT CHẤT LƯỢNG KHÔNG KHÍ" />
      {useApi && !error && stations.length > 0 && (
        <div className="api-banner api-banner-live">
          Live — cập nhật mỗi {Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 3000}ms
        </div>
      )}
      {useApi && error && (
        <div className="api-banner api-banner-error">
          Không kết nối được API ({error}). Chạy: <code>docker compose up -d --build</code>
        </div>
      )}
      {useApi && loading && stations.length === 0 && (
        <div className="api-banner">Đang tải dữ liệu…</div>
      )}
      <AlertBanner alerts={alerts} />
      <ForecastBanner forecasts={forecasts} />
      <section className="station-row">
        {stations.map((station) => (
          <StationCard
            key={station.id}
            station={station}
            alertLevel={alertByStation[station.id]}
          />
        ))}
      </section>
      <section className="middle-row">
        <div className="panel map-panel map-panel-full">
          <MapView stations={stations} />
        </div>
      </section>
      <section className="station-sections">
        {stations.map((station) => (
          <StationSection
            key={station.id}
            station={station}
            chartData={histories[station.id]}
            forecast={forecastByStation[station.id]}
          />
        ))}
      </section>
    </main>
  )
}
