import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutGrid,
  List,
  Map,
  Clock,
  Activity,
  Flame,
  Settings,
} from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { to: '/', label: 'OVERVIEW', icon: LayoutGrid, end: true },
  { to: '/history', label: 'HISTORY', icon: Clock },
  { to: '/settings', label: 'SETTINGS', icon: Settings },
  { to: '/status', label: 'SYSTEM STATUS', icon: Activity },
  { to: '/heatmap', label: 'HEATMAP', icon: Flame },
  { to: '/map', label: 'MAP DIARY', icon: Map },
  { to: '/detailed', label: 'DETAILED DATA', icon: List },
]

export default function Layout() {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">IoT</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} strokeWidth={1.8} />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>
      <Outlet />
    </div>
  )
}
