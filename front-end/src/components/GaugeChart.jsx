import './GaugeChart.css'

/** Semi-circle gauge: flat base, arc opens upward (exactly 180°). */
export default function GaugeChart({ type, value, max = 100, gradientId }) {
  const cx = 100
  const cy = 92
  const r = 72
  const stroke = 11
  const clamped = Math.min(Math.max(value, 0), max)
  const ratio = clamped / max

  const angleRad = Math.PI - ratio * Math.PI
  const needleLen = r - stroke
  const needleX = cx + needleLen * Math.cos(angleRad)
  const needleY = cy - needleLen * Math.sin(angleRad)

  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  const gid = gradientId || `gauge-grad-${type}`

  return (
    <div className="gauge-item">
      <svg viewBox="0 0 200 108" className="gauge-svg" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>
        <path
          d={arcPath}
          fill="none"
          stroke="#252b3d"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={arcPath}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#e2e8f0"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="5" fill="#e2e8f0" />
        <text x={cx - r + 4} y={cy + 14} fill="#64748b" fontSize="9" textAnchor="start">
          0
        </text>
        <text x={cx} y={cy - r + 6} fill="#64748b" fontSize="9" textAnchor="middle">
          {Math.round(max / 2)}
        </text>
        <text x={cx + r - 4} y={cy + 14} fill="#64748b" fontSize="9" textAnchor="end">
          {max}
        </text>
      </svg>
      <div className="gauge-type">{type}</div>
      <div className="gauge-value">{clamped}</div>
    </div>
  )
}
