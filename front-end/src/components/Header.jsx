import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import './Header.css'

export default function Header() {
  const [darkMode, setDarkMode] = useState(true)

  return (
    <header className="dashboard-header">
      <h1 className="dashboard-title">
        TỔNG QUAN HỆ THỐNG GIÁM SÁT CHẤT LƯỢNG KHÔNG KHÍ
      </h1>
      <div className="header-actions">
        <button type="button" className="btn-export">
          Export Data (Excel/CSV)
        </button>
        <div className="theme-toggle">
          <span className="theme-label">Dark/Light Mode</span>
          <button
            type="button"
            className={`toggle-switch ${darkMode ? 'on' : ''}`}
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
          >
            <span className="toggle-thumb">
              {darkMode ? <Moon size={12} /> : <Sun size={12} />}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
