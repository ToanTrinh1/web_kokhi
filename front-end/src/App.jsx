import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import OverviewPage from './pages/OverviewPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import SystemStatusPage from './pages/SystemStatusPage'
import HeatmapPage from './pages/HeatmapPage'
import MapDiaryPage from './pages/MapDiaryPage'
import DetailedDataPage from './pages/DetailedDataPage'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OverviewPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="status" element={<SystemStatusPage />} />
        <Route path="heatmap" element={<HeatmapPage />} />
        <Route path="map" element={<MapDiaryPage />} />
        <Route path="detailed" element={<DetailedDataPage />} />
      </Route>
    </Routes>
  )
}
