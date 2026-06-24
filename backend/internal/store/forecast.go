package store

import (
	"context"
	"fmt"
	"time"

	"github.com/web-kokhi/backend/internal/forecast"
	"github.com/web-kokhi/backend/internal/model"
	"github.com/web-kokhi/backend/internal/notify"
)

func (s *Store) ForecastAll(steps int) ([]forecast.Result, error) {
	stations, err := s.ListStations()
	if err != nil {
		return nil, err
	}
	cfg, err := s.GetSettings()
	if err != nil {
		return nil, err
	}

	out := make([]forecast.Result, 0, len(stations))
	for _, st := range stations {
		res, err := s.ForecastStation(st.ID, st.Name, steps, cfg.PM25Warning)
		if err != nil {
			return nil, err
		}
		out = append(out, res)
	}
	return out, nil
}

func (s *Store) ForecastStation(stationID int, name string, steps int, warningThreshold float64) (forecast.Result, error) {
	if name == "" {
		meta, ok, err := s.meta(stationID)
		if err != nil {
			return forecast.Result{}, err
		}
		if !ok {
			return forecast.Result{}, fmt.Errorf("station not found")
		}
		name = meta.Name
	}

	readings, err := s.recentReadings(stationID, 120)
	if err != nil {
		return forecast.Result{}, err
	}
	inputs := make([]forecast.InputPoint, len(readings))
	for i, r := range readings {
		inputs[i] = forecast.InputPoint{PM25: r.PM25, RecordedAt: r.RecordedAt}
	}
	return forecast.Compute(name, stationID, inputs, steps, warningThreshold), nil
}

func (s *Store) recentReadings(stationID int, limit int) ([]model.Reading, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		SELECT station_id, pm25, pm10, temp, humidity, recorded_at
		FROM readings
		WHERE station_id = $1
		ORDER BY recorded_at DESC
		LIMIT $2`, stationID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.Reading, 0, limit)
	for rows.Next() {
		var r model.Reading
		if err := rows.Scan(&r.StationID, &r.PM25, &r.PM10, &r.Temp, &r.Humidity, &r.RecordedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// reverse to chronological order
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out, nil
}

const forecastNotifyCooldown = 30 * time.Minute

func (s *Store) CheckForecastNotify(stationID int, stationName string) error {
	if s.Telegram == nil || !s.Telegram.Enabled() {
		return nil
	}
	cfg, err := s.GetSettings()
	if err != nil || !cfg.TelegramEnabled || cfg.TelegramChatID == "" {
		return nil
	}

	res, err := s.ForecastStation(stationID, stationName, 6, cfg.PM25Warning)
	if err != nil || !res.WillExceedWarning {
		return err
	}

	ctx := context.Background()
	var recent int
	err = s.pool.QueryRow(ctx, `
		SELECT 1 FROM alerts
		WHERE station_id = $1 AND metric = 'forecast' AND level = 'warning'
		  AND created_at > $2 LIMIT 1`,
		stationID, time.Now().Add(-forecastNotifyCooldown),
	).Scan(&recent)
	if err == nil {
		return nil
	}

	msg := res.Message
	_, err = s.pool.Exec(ctx, `
		INSERT INTO alerts (station_id, metric, level, value, message, created_at)
		VALUES ($1, 'forecast', 'warning', $2, $3, $4)`,
		stationID, res.CurrentPM25, msg, time.Now(),
	)
	if err != nil {
		return err
	}

	return s.Telegram.Send(cfg.TelegramChatID, notifyForecastText(stationName, msg))
}

func notifyForecastText(stationName, message string) string {
	return notify.FormatForecast(stationName, message)
}
