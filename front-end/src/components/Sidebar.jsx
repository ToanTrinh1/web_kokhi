import {
  LayoutGrid,
  List,
  Map,
  Clock,
  Activity,
  Flame,
  Settings,
  ChevronDown,
} from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { id: 'overview', label: 'OVERVIEW', icon: LayoutGrid, active: true },
  { id: 'detailed', label: 'DETAILED DATA', icon: List, hasDropdown: true },
  { id: 'map', label: 'MAP DIARY', icon: Map },
  { id: 'history', label: 'HISTORY', icon: Clock },
  { id: 'status', label: 'SYSTEM STATUS', icon: Activity, hasDropdown: true },
  { id: 'heatmap', label: 'HEATMAP', icon: Flame, hasDropdown: true },
  { id: 'settings', label: 'SYSTEM STATUS', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">IoT</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${item.active ? 'active' : ''}`}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span className="nav-label">{item.label}</span>
              {item.hasDropdown && (
                <ChevronDown size={14} className="nav-chevron" />
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
