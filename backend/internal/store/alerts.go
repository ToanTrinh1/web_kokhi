package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/web-kokhi/backend/internal/aqi"
	"github.com/web-kokhi/backend/internal/model"
	"github.com/web-kokhi/backend/internal/notify"
)

const alertCooldown = 10 * time.Minute

func (s *Store) GetSettings() (model.Settings, error) {
	ctx := context.Background()
	var cfg model.Settings
	err := s.pool.QueryRow(ctx, `
		SELECT pm25_warning, pm25_critical, aqi_warning, aqi_critical,
		       telegram_enabled, telegram_chat_id
		FROM settings WHERE id = 1`).Scan(
		&cfg.PM25Warning, &cfg.PM25Critical, &cfg.AQIWarning, &cfg.AQICritical,
		&cfg.TelegramEnabled, &cfg.TelegramChatID,
	)
	if err != nil {
		return cfg, err
	}
	cfg.TelegramReady = s.Telegram != nil && s.Telegram.Enabled() && cfg.TelegramChatID != ""
	return cfg, nil
}

func (s *Store) UpdateSettings(cfg model.Settings) (model.Settings, error) {
	ctx := context.Background()
	_, err := s.pool.Exec(ctx, `
		UPDATE settings SET
			pm25_warning = $1,
			pm25_critical = $2,
			aqi_warning = $3,
			aqi_critical = $4,
			telegram_enabled = $5,
			telegram_chat_id = $6
		WHERE id = 1`,
		cfg.PM25Warning, cfg.PM25Critical, cfg.AQIWarning, cfg.AQICritical,
		cfg.TelegramEnabled, cfg.TelegramChatID,
	)
	if err != nil {
		return model.Settings{}, err
	}
	return s.GetSettings()
}

func (s *Store) TestTelegram(chatID string) error {
	if s.Telegram == nil || !s.Telegram.Enabled() {
		return fmt.Errorf("TELEGRAM_BOT_TOKEN chưa cấu hình trên server")
	}
	id := chatID
	if id == "" {
		cfg, err := s.GetSettings()
		if err != nil {
			return err
		}
		id = cfg.TelegramChatID
	}
	return s.Telegram.Send(id, "✅ Web Kokhi — Telegram đã kết nối thành công!")
}

func (s *Store) ListAlerts(stationID int, hours int) ([]model.Alert, error) {
	if hours <= 0 {
		hours = 24
	}
	cutoff := time.Now().Add(-time.Duration(hours) * time.Hour)
	ctx := context.Background()

	query := `
		SELECT a.id, a.station_id, s.name, a.metric, a.level, a.value, a.message, a.created_at
		FROM alerts a
		JOIN stations s ON s.id = a.station_id
		WHERE a.created_at >= $1`
	args := []any{cutoff}
	if stationID > 0 {
		query += ` AND a.station_id = $2`
		args = append(args, stationID)
	}
	query += ` ORDER BY a.created_at DESC LIMIT 200`

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.Alert, 0, 32)
	for rows.Next() {
		var al model.Alert
		if err := rows.Scan(
			&al.ID, &al.StationID, &al.StationName, &al.Metric, &al.Level,
			&al.Value, &al.Message, &al.CreatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, al)
	}
	return out, rows.Err()
}

func (s *Store) ActiveAlertLevels(stationID int) (map[int]string, error) {
	ctx := context.Background()
	cutoff := time.Now().Add(-1 * time.Hour)
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT ON (station_id) station_id, level
		FROM alerts
		WHERE created_at >= $1
		ORDER BY station_id, created_at DESC`, cutoff)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make(map[int]string)
	for rows.Next() {
		var id int
		var level string
		if err := rows.Scan(&id, &level); err != nil {
			return nil, err
		}
		if stationID == 0 || stationID == id {
			out[id] = level
		}
	}
	return out, rows.Err()
}

func (s *Store) ListReadingLog(stationID int, hours int, limit int) ([]model.ReadingLog, error) {
	if hours <= 0 {
		hours = 24
	}
	if limit <= 0 || limit > 500 {
		limit = 200
	}
	cutoff := time.Now().Add(-time.Duration(hours) * time.Hour)
	ctx := context.Background()

	query := `
		SELECT r.id, r.station_id, s.name, r.pm25, r.pm10, r.temp, r.humidity, r.quality_flag, r.recorded_at
		FROM readings r
		JOIN stations s ON s.id = r.station_id
		WHERE r.recorded_at >= $1`
	args := []any{cutoff}
	if stationID > 0 {
		query += ` AND r.station_id = $2`
		args = append(args, stationID)
	}
	query += fmt.Sprintf(` ORDER BY r.recorded_at DESC LIMIT %d`, limit)

	rows, err := s.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.ReadingLog, 0, limit)
	for rows.Next() {
		var row model.ReadingLog
		if err := rows.Scan(
			&row.ID, &row.StationID, &row.StationName,
			&row.PM25, &row.PM10, &row.Temp, &row.Humidity, &row.QualityFlag, &row.RecordedAt,
		); err != nil {
			return nil, err
		}
		row.AQI, _, _ = aqi.FromPM25(row.PM25)
		out = append(out, row)
	}
	return out, rows.Err()
}

func (s *Store) evaluateAlerts(r model.Reading) error {
	cfg, err := s.GetSettings()
	if err != nil {
		return err
	}
	aqiVal, _, _ := aqi.FromPM25(r.PM25)

	checks := []struct {
		metric string
		value  float64
		level  string
		when   bool
		msg    string
	}{
		{
			metric: "pm25", value: r.PM25, level: "critical",
			when: r.PM25 >= cfg.PM25Critical,
			msg:  fmt.Sprintf("PM2.5 vượt ngưỡng nguy hiểm (%.1f ≥ %.0f µg/m³)", r.PM25, cfg.PM25Critical),
		},
		{
			metric: "pm25", value: r.PM25, level: "warning",
			when: r.PM25 >= cfg.PM25Warning && r.PM25 < cfg.PM25Critical,
			msg:  fmt.Sprintf("PM2.5 vượt ngưỡng cảnh báo (%.1f ≥ %.0f µg/m³)", r.PM25, cfg.PM25Warning),
		},
		{
			metric: "aqi", value: float64(aqiVal), level: "critical",
			when: aqiVal >= cfg.AQICritical,
			msg:  fmt.Sprintf("AQI vượt ngưỡng nguy hiểm (%d ≥ %d)", aqiVal, cfg.AQICritical),
		},
		{
			metric: "aqi", value: float64(aqiVal), level: "warning",
			when: aqiVal >= cfg.AQIWarning && aqiVal < cfg.AQICritical,
			msg:  fmt.Sprintf("AQI vượt ngưỡng cảnh báo (%d ≥ %d)", aqiVal, cfg.AQIWarning),
		},
	}

	ctx := context.Background()
	for _, c := range checks {
		if !c.when {
			continue
		}
		var recent int
		err := s.pool.QueryRow(ctx, `
			SELECT 1 FROM alerts
			WHERE station_id = $1 AND metric = $2 AND level = $3
			  AND created_at > $4 LIMIT 1`,
			r.StationID, c.metric, c.level, time.Now().Add(-alertCooldown),
		).Scan(&recent)
		if err == nil {
			continue
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		_, err = s.pool.Exec(ctx, `
			INSERT INTO alerts (station_id, metric, level, value, message, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)`,
			r.StationID, c.metric, c.level, c.value, c.msg, r.RecordedAt,
		)
		if err != nil {
			return err
		}
		s.sendTelegramAlert(cfg, r.StationID, c.level, c.msg)
	}
	return nil
}

func (s *Store) sendTelegramAlert(cfg model.Settings, stationID int, level, message string) {
	if !cfg.TelegramEnabled || cfg.TelegramChatID == "" || s.Telegram == nil || !s.Telegram.Enabled() {
		return
	}
	ctx := context.Background()
	var name string
	_ = s.pool.QueryRow(ctx, `SELECT name FROM stations WHERE id = $1`, stationID).Scan(&name)
	text := notify.FormatAlert(name, level, message)
	_ = s.Telegram.Send(cfg.TelegramChatID, text)
}
