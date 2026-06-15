import Sidebar from './components/Sidebar'
import Header from './components/Header'
import StationCard from './components/StationCard'
import MapView from './components/MapView'
import GaugeChart from './components/GaugeChart'
import PMChart from './components/PMChart'
import TempHumChart from './components/TempHumChart'
import { stations } from './data/mockData'
import './App.css'

function App() {
  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-main">
        <Header />
        <section className="station-row">
          {stations.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </section>
        <section className="middle-row">
          <div className="panel map-panel">
            <MapView />
          </div>
          <div className="panel gauge-panel-wrap">
            <div className="gauge-panel">
              {stations.map((station) => (
                <GaugeChart key={station.id} station={station} />
              ))}
            </div>
          </div>
        </section>
        <section className="chart-row">
          <PMChart />
          <TempHumChart />
        </section>
      </main>
    </div>
  )
}

export default App
