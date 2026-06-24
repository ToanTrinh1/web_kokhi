package store

import (
	"context"
	"time"

	"github.com/web-kokhi/backend/internal/aqi"
	"github.com/web-kokhi/backend/internal/model"
)

func (s *Store) ReadingStats(hours int) ([]model.ReadingStats, error) {
	if hours <= 0 {
		hours = 24
	}
	cutoff := time.Now().Add(-time.Duration(hours) * time.Hour)
	ctx := context.Background()

	rows, err := s.pool.Query(ctx, `
		SELECT s.id, s.name,
		       COUNT(r.id),
		       MIN(r.pm25), MAX(r.pm25), AVG(r.pm25),
		       MIN(r.pm10), MAX(r.pm10), AVG(r.pm10),
		       MIN(r.temp), MAX(r.temp), AVG(r.temp),
		       MIN(r.humidity), MAX(r.humidity), AVG(r.humidity)
		FROM stations s
		LEFT JOIN readings r ON r.station_id = s.id AND r.recorded_at >= $1
		GROUP BY s.id, s.name
		ORDER BY s.id`, cutoff)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.ReadingStats, 0, 3)
	for rows.Next() {
		var st model.ReadingStats
		var pm25Min, pm25Max, pm25Avg *float64
		var pm10Min, pm10Max, pm10Avg *float64
		var tempMin, tempMax, tempAvg *float64
		var humMin, humMax, humAvg *float64

		if err := rows.Scan(
			&st.StationID, &st.StationName, &st.Count,
			&pm25Min, &pm25Max, &pm25Avg,
			&pm10Min, &pm10Max, &pm10Avg,
			&tempMin, &tempMax, &tempAvg,
			&humMin, &humMax, &humAvg,
		); err != nil {
			return nil, err
		}

		if pm25Min != nil {
			st.PM25Min = round1(*pm25Min)
			st.PM25Max = round1(*pm25Max)
			st.PM25Avg = round1(*pm25Avg)
			st.PM10Min = round1(*pm10Min)
			st.PM10Max = round1(*pm10Max)
			st.PM10Avg = round1(*pm10Avg)
			st.TempMin = round1(*tempMin)
			st.TempMax = round1(*tempMax)
			st.TempAvg = round1(*tempAvg)
			st.HumidityMin = round1(*humMin)
			st.HumidityMax = round1(*humMax)
			st.HumidityAvg = round1(*humAvg)

			aqiMin, _, _ := aqi.FromPM25(st.PM25Min)
			aqiMax, _, _ := aqi.FromPM25(st.PM25Max)
			aqiAvg, _, _ := aqi.FromPM25(st.PM25Avg)
			st.AQIMin = aqiMin
			st.AQIMax = aqiMax
			st.AQIAvg = aqiAvg
		}
		out = append(out, st)
	}
	return out, rows.Err()
}
