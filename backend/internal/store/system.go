package store

import (
	"context"
	"time"

	"github.com/web-kokhi/backend/internal/aqi"
	"github.com/web-kokhi/backend/internal/model"
)

func (s *Store) GetSystemStatus(startedAt time.Time) (model.SystemStatus, error) {
	ctx := context.Background()
	stations, err := s.ListStations()
	if err != nil {
		return model.SystemStatus{}, err
	}

	online := 0
	stationRows := make([]model.StationStatus, 0, len(stations))
	for _, st := range stations {
		if st.Online {
			online++
		}
		aqiVal, _, _ := aqi.FromPM25(st.PM25)
		var lastSeen *time.Time
		if !st.UpdatedAt.IsZero() {
			t := st.UpdatedAt
			lastSeen = &t
		}
		stationRows = append(stationRows, model.StationStatus{
			ID:       st.ID,
			Name:     st.Name,
			Online:   st.Online,
			LastSeen: lastSeen,
			LastPM25: st.PM25,
			LastAQI:  aqiVal,
		})
	}

	todayStart := time.Now().Truncate(24 * time.Hour)
	var readingsToday, alertsToday int64
	if err := s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM readings WHERE recorded_at >= $1`, todayStart).Scan(&readingsToday); err != nil {
		return model.SystemStatus{}, err
	}
	if err := s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM alerts WHERE created_at >= $1`, todayStart).Scan(&alertsToday); err != nil {
		return model.SystemStatus{}, err
	}

	return model.SystemStatus{
		APIStatus:       "ok",
		DBStatus:        "ok",
		Mode:            "simulator",
		StartedAt:       startedAt,
		UptimeSec:       int64(time.Since(startedAt).Seconds()),
		StationsTotal:   len(stations),
		StationsOnline:  online,
		ReadingsToday:   readingsToday,
		AlertsToday:     alertsToday,
		StaleThresholdS: int(staleAfter.Seconds()),
		Stations:        stationRows,
	}, nil
}

func (s *Store) HeatmapPoints(hours int) ([]model.HeatmapPoint, error) {
	if hours <= 0 {
		hours = 6
	}
	if hours > 168 {
		hours = 168
	}
	cutoff := time.Now().Add(-time.Duration(hours) * time.Hour)
	ctx := context.Background()

	rows, err := s.pool.Query(ctx, `
		SELECT s.lat, s.lng, r.pm25, r.recorded_at, s.id, s.name
		FROM readings r
		JOIN stations s ON s.id = r.station_id
		WHERE r.recorded_at >= $1
		ORDER BY r.recorded_at DESC
		LIMIT 500`, cutoff)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.HeatmapPoint, 0, 128)
	for rows.Next() {
		var p model.HeatmapPoint
		if err := rows.Scan(&p.Lat, &p.Lng, &p.PM25, &p.RecordedAt, &p.StationID, &p.StationName); err != nil {
			return nil, err
		}
		p.AQI, _, _ = aqi.FromPM25(p.PM25)
		out = append(out, p)
	}
	return out, rows.Err()
}
