import './GaugeChart.css'

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

export default function GaugeChart({ station }) {
  const cx = 80
  const cy = 75
  const r = 55
  const value = Math.min(station.gaugeValue, 100)
  const needleAngle = 180 + (value / 100) * 180
  const needleTip = polarToCartesian(cx, cy, r - 12, needleAngle)

  return (
    <div className="gauge-item">
      <div className="gauge-label-top">{station.name}</div>
      <svg viewBox="0 0 160 95" className="gauge-svg">
        <defs>
          <linearGradient id={`grad-${station.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>
        <path
          d={describeArc(cx, cy, r, 180, 360)}
          fill="none"
          stroke="#252b3d"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={describeArc(cx, cy, r, 180, 360)}
          fill="none"
          stroke={`url(#grad-${station.id})`}
          strokeWidth="10"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke="#e2e8f0"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4" fill="#e2e8f0" />
        <text x="12" y="88" fill="#64748b" fontSize="8">0</text>
        <text x="76" y="14" fill="#64748b" fontSize="8">50</text>
        <text x="140" y="88" fill="#64748b" fontSize="8">100</text>
      </svg>
      <div className="gauge-type">{station.gaugeType}</div>
    </div>
  )
}
