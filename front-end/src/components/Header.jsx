import { Moon, Sun, Download } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import './Header.css'

export default function Header({ title, showExport, onExport }) {
  const { theme, toggleTheme } = useTheme()
  const darkMode = theme === 'dark'

  return (
    <header className="dashboard-header">
      <h1 className="dashboard-title">{title}</h1>
      <div className="header-actions">
        {showExport && (
          <button type="button" className="btn-export" onClick={onExport}>
            <Download size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
            Export CSV
          </button>
        )}
        <div className="theme-toggle">
          <span className="theme-label">Dark/Light Mode</span>
          <button
            type="button"
            className={`toggle-switch ${darkMode ? 'on' : ''}`}
            onClick={toggleTheme}
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
