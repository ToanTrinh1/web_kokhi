package aqi

// FromPM25 maps PM2.5 µg/m³ to a simplified US AQI bucket for dashboard display.
func FromPM25(pm25 float64) (int, string, string) {
	switch {
	case pm25 <= 12:
		return clampPM(pm25), "Good", "#4ade80"
	case pm25 <= 35.4:
		return clampPM(pm25), "Moderate", "#facc15"
	case pm25 <= 55.4:
		return clampPM(pm25), "Unhealthy for Sensitive", "#fb923c"
	default:
		return clampPM(pm25), "Unhealthy", "#f87171"
	}
}

func clampPM(pm25 float64) int {
	v := int(pm25 + 0.5)
	if v < 0 {
		return 0
	}
	if v > 500 {
		return 500
	}
	return v
}
