package store

import (
	"time"

	"github.com/web-kokhi/backend/internal/aqi"
	"github.com/web-kokhi/backend/internal/model"
)

func buildStation(m model.StationMeta, r model.Reading, online bool) model.Station {
	aqiVal, label, color := aqi.FromPM25(r.PM25)
	gaugePM25 := float64(aqiVal)
	if gaugePM25 > 100 {
		gaugePM25 = 100
	}
	gaugePM10 := r.PM10
	if gaugePM10 > 100 {
		gaugePM10 = 100
	}

	return model.Station{
		ID:        m.ID,
		Name:      m.Name,
		Subtitle:  m.Subtitle,
		Online:    online,
		Time:      r.RecordedAt.Format("15:04:05"),
		AQI:       aqiVal,
		AQILabel:  label,
		PM25:      round1(r.PM25),
		Temp:      round1(r.Temp),
		Humidity:  round1(r.Humidity),
		Lat:       m.Lat,
		Lng:       m.Lng,
		Color:     color,
		UpdatedAt: r.RecordedAt,
		LastSeen:  &r.RecordedAt,
		Gauges: []model.Gauge{
			{Type: "PM2.5", Value: round1(gaugePM25), Max: 100},
			{Type: "PM10", Value: round1(gaugePM10), Max: 100},
			{Type: "AQI", Value: float64(aqiVal), Max: 100},
		},
	}
}

func round1(v float64) float64 {
	return float64(int(v*10+0.5)) / 10
}

func isOnline(lastAt time.Time, staleAfter time.Duration) bool {
	if lastAt.IsZero() {
		return false
	}
	return time.Since(lastAt) <= staleAfter
}
