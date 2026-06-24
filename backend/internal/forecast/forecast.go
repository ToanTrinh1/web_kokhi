package forecast

import (
	"fmt"
	"math"
	"time"

	"github.com/web-kokhi/backend/internal/aqi"
	"github.com/web-kokhi/backend/internal/health"
)

type InputPoint struct {
	PM25       float64
	RecordedAt time.Time
}

type Point struct {
	Time     string  `json:"time"`
	PM25     float64 `json:"pm25"`
	AQI      int     `json:"aqi"`
	Forecast bool    `json:"forecast"`
}

type Result struct {
	StationID         int      `json:"station_id"`
	StationName       string   `json:"station_name"`
	CurrentPM25       float64  `json:"current_pm25"`
	Trend             string   `json:"trend"`
	SlopePerHour      float64  `json:"slope_per_hour"`
	Points            []Point  `json:"points"`
	WillExceedWarning bool     `json:"will_exceed_warning"`
	HoursUntilWarning *float64 `json:"hours_until_warning,omitempty"`
	Message           string   `json:"message"`
	SufficientData    bool     `json:"sufficient_data"`
	RiskLevel         string   `json:"risk_level"`
	HealthAdvice      string   `json:"health_advice"`
}

const minPoints = 8

func Compute(name string, stationID int, readings []InputPoint, steps int, warningThreshold float64) Result {
	out := Result{
		StationID:   stationID,
		StationName: name,
		Trend:       "stable",
	}

	if len(readings) < minPoints {
		out.Message = "Chưa đủ dữ liệu để dự báo"
		return out
	}

	if steps <= 0 {
		steps = 6
	}
	if steps > 24 {
		steps = 24
	}

	n := len(readings)
	avgInterval := averageInterval(readings)
	if avgInterval <= 0 {
		avgInterval = 5 * time.Second
	}

	start := readings[0].RecordedAt
	xs := make([]float64, n)
	ys := make([]float64, n)
	for i, r := range readings {
		xs[i] = r.RecordedAt.Sub(start).Hours()
		ys[i] = r.PM25
	}

	slope, intercept := linearRegression(xs, ys)
	out.SufficientData = true
	out.CurrentPM25 = round1(ys[n-1])
	out.SlopePerHour = round1(slope)

	switch {
	case slope > 0.5:
		out.Trend = "rising"
	case slope < -0.5:
		out.Trend = "falling"
	default:
		out.Trend = "stable"
	}

	lastTime := readings[n-1].RecordedAt
	horizonHours := avgInterval.Hours() * float64(steps)

	for i := 1; i <= steps; i++ {
		t := lastTime.Add(avgInterval * time.Duration(i))
		x := t.Sub(start).Hours()
		pm := slope*x + intercept
		if pm < 0 {
			pm = 0
		}
		aqiVal, _, _ := aqi.FromPM25(pm)
		out.Points = append(out.Points, Point{
			Time:     t.Format("15:04"),
			PM25:     round1(pm),
			AQI:      aqiVal,
			Forecast: true,
		})
	}

	if warningThreshold > 0 && slope > 0 && out.CurrentPM25 < warningThreshold {
		targetX := (warningThreshold - intercept) / slope
		currentX := xs[n-1]
		if targetX > currentX {
			hours := targetX - currentX
			out.WillExceedWarning = true
			h := round1(hours)
			out.HoursUntilWarning = &h
			out.Message = fmt.Sprintf(
				"%s — dự báo PM2.5 vượt ngưỡng cảnh báo (%.0f µg/m³) trong ~%.1f giờ",
				name, warningThreshold, hours,
			)
		}
	}

	if out.Message == "" && len(out.Points) > 0 {
		last := out.Points[len(out.Points)-1]
		trendVI := map[string]string{"rising": "tăng", "falling": "giảm", "stable": "ổn định"}[out.Trend]
		mins := int(math.Max(1, math.Round(horizonHours*60)))
		out.Message = fmt.Sprintf(
			"%s — xu hướng %s, dự báo PM2.5 ~%.1f µg/m³ sau %d phút",
			name, trendVI, last.PM25, mins,
		)
	}

	if out.SufficientData {
		aqiNow, _, _ := aqi.FromPM25(out.CurrentPM25)
		out.RiskLevel, out.HealthAdvice = health.Advice(aqiNow)
		if len(out.Points) > 0 {
			lastAQI := out.Points[len(out.Points)-1].AQI
			_, futureAdvice := health.Advice(lastAQI)
			if lastAQI > aqiNow+15 {
				out.HealthAdvice += " " + futureAdvice
			}
		}
	}

	return out
}

func linearRegression(xs, ys []float64) (slope, intercept float64) {
	n := float64(len(xs))
	if n < 2 {
		return 0, ys[0]
	}
	var sumX, sumY, sumXY, sumX2 float64
	for i := range xs {
		sumX += xs[i]
		sumY += ys[i]
		sumXY += xs[i] * ys[i]
		sumX2 += xs[i] * xs[i]
	}
	denom := n*sumX2 - sumX*sumX
	if math.Abs(denom) < 1e-9 {
		return 0, sumY / n
	}
	slope = (n*sumXY - sumX*sumY) / denom
	intercept = (sumY - slope*sumX) / n
	return slope, intercept
}

func averageInterval(readings []InputPoint) time.Duration {
	if len(readings) < 2 {
		return 0
	}
	total := readings[len(readings)-1].RecordedAt.Sub(readings[0].RecordedAt)
	return total / time.Duration(len(readings)-1)
}

func round1(v float64) float64 {
	return math.Round(v*10) / 10
}
