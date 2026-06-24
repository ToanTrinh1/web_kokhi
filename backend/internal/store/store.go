package store

import (
	"context"
	"errors"
	"fmt"
	"net"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/web-kokhi/backend/internal/anomaly"
	"github.com/web-kokhi/backend/internal/model"
	"github.com/web-kokhi/backend/internal/notify"
)

const staleAfter = 2 * time.Minute

type Store struct {
	pool        *pgxpool.Pool
	Telegram    *notify.Client
	broadcaster Broadcaster
}

func New(pool *pgxpool.Pool, telegram *notify.Client) *Store {
	return &Store{pool: pool, Telegram: telegram}
}

func (s *Store) Pool() *pgxpool.Pool {
	return s.pool
}

func (s *Store) ListStations() ([]model.Station, error) {
	ctx := context.Background()
	rows, err := s.pool.Query(ctx, `
		SELECT s.id, s.name, s.subtitle, s.lat, s.lng,
		       s.pm25_base, s.pm10_base, s.temp_base, s.hum_base,
		       r.pm25, r.pm10, r.temp, r.humidity, r.recorded_at
		FROM stations s
		LEFT JOIN LATERAL (
			SELECT pm25, pm10, temp, humidity, recorded_at
			FROM readings
			WHERE station_id = s.id
			ORDER BY recorded_at DESC
			LIMIT 1
		) r ON TRUE
		ORDER BY s.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.Station, 0, 3)
	for rows.Next() {
		st, err := scanStationRow(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, st)
	}
	return out, rows.Err()
}

func (s *Store) GetStation(id int) (model.Station, error) {
	ctx := context.Background()
	row := s.pool.QueryRow(ctx, `
		SELECT s.id, s.name, s.subtitle, s.lat, s.lng,
		       s.pm25_base, s.pm10_base, s.temp_base, s.hum_base,
		       r.pm25, r.pm10, r.temp, r.humidity, r.recorded_at
		FROM stations s
		LEFT JOIN LATERAL (
			SELECT pm25, pm10, temp, humidity, recorded_at
			FROM readings
			WHERE station_id = s.id
			ORDER BY recorded_at DESC
			LIMIT 1
		) r ON TRUE
		WHERE s.id = $1`, id)

	st, err := scanStationRow(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Station{}, fmt.Errorf("station not found")
		}
		return model.Station{}, err
	}
	return st, nil
}

func (s *Store) GetHistory(id int, hours int) ([]model.HistoryPoint, error) {
	if hours <= 0 {
		hours = 24
	}
	cutoff := time.Now().Add(-time.Duration(hours) * time.Hour)
	ctx := context.Background()

	var exists int
	if err := s.pool.QueryRow(ctx, `SELECT 1 FROM stations WHERE id = $1`, id).Scan(&exists); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("station not found")
		}
		return nil, err
	}

	rows, err := s.pool.Query(ctx, `
		SELECT pm25, pm10, recorded_at
		FROM readings
		WHERE station_id = $1 AND recorded_at >= $2
		ORDER BY recorded_at ASC`, id, cutoff)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.HistoryPoint, 0, 64)
	for rows.Next() {
		var pm25, pm10 float64
		var recordedAt time.Time
		if err := rows.Scan(&pm25, &pm10, &recordedAt); err != nil {
			return nil, err
		}
		out = append(out, model.HistoryPoint{
			Time: recordedAt.Format("15:04"),
			PM25: round1(pm25),
			PM10: round1(pm10),
		})
	}
	return out, rows.Err()
}

func (s *Store) ApplyReading(in model.ReadingInput, sourceIP string) (model.Station, error) {
	meta, ok, err := s.meta(in.StationID)
	if err != nil {
		return model.Station{}, err
	}
	if !ok {
		return model.Station{}, fmt.Errorf("station not found")
	}

	quality := s.classifyReading(in.StationID, in.PM25)
	now := time.Now()
	r := model.Reading{
		StationID:  in.StationID,
		PM25:       in.PM25,
		PM10:       in.PM10,
		Temp:       in.Temp,
		Humidity:   in.Humidity,
		RecordedAt: now,
	}
	if err := s.insertReading(r, quality, in.Firmware, in.RSSI, sourceIP); err != nil {
		return model.Station{}, err
	}
	s.notifyStations()
	return buildStation(meta, r, true), nil
}

func (s *Store) ApplySimulatedReading(id int, r model.Reading) error {
	if _, ok, err := s.meta(id); err != nil {
		return err
	} else if !ok {
		return fmt.Errorf("station not found")
	}
	if err := s.insertReading(r, anomaly.QualityOK, "", nil, ""); err != nil {
		return err
	}
	s.notifyStations()
	return nil
}

func (s *Store) Meta(id int) (model.StationMeta, bool) {
	meta, ok, err := s.meta(id)
	if err != nil {
		return model.StationMeta{}, false
	}
	return meta, ok
}

func (s *Store) meta(id int) (model.StationMeta, bool, error) {
	ctx := context.Background()
	var m model.StationMeta
	err := s.pool.QueryRow(ctx, `
		SELECT id, name, subtitle, lat, lng, pm25_base, pm10_base, temp_base, hum_base
		FROM stations WHERE id = $1`, id).Scan(
		&m.ID, &m.Name, &m.Subtitle, &m.Lat, &m.Lng,
		&m.PM25Base, &m.PM10Base, &m.TempBase, &m.HumBase,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.StationMeta{}, false, nil
		}
		return model.StationMeta{}, false, err
	}
	return m, true, nil
}

func (s *Store) insertReading(r model.Reading, quality, firmware string, rssi *int, sourceIP string) error {
	ctx := context.Background()
	var readingID int64
	err := s.pool.QueryRow(ctx, `
		INSERT INTO readings (station_id, pm25, pm10, temp, humidity, recorded_at, quality_flag, firmware_version, rssi, source_ip)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id`,
		r.StationID, r.PM25, r.PM10, r.Temp, r.Humidity, r.RecordedAt, quality, firmware, rssi, parseIP(sourceIP),
	).Scan(&readingID)
	if err != nil {
		return err
	}

	_, _ = s.pool.Exec(ctx, `
		UPDATE stations SET last_seen_at = $1, firmware_version = COALESCE(NULLIF($2,''), firmware_version)
		WHERE id = $3`, r.RecordedAt, firmware, r.StationID)

	if quality == anomaly.QualityOK {
		if err := s.evaluateAlerts(r); err != nil {
			return err
		}
		meta, ok, _ := s.meta(r.StationID)
		if ok {
			_ = s.CheckForecastNotify(r.StationID, meta.Name)
		}
	}
	return nil
}

func parseIP(s string) any {
	if s == "" {
		return nil
	}
	ip := net.ParseIP(s)
	if ip == nil {
		return nil
	}
	return ip
}

type scannable interface {
	Scan(dest ...any) error
}

func scanStationRow(row scannable) (model.Station, error) {
	var m model.StationMeta
	var pm25, pm10, temp, humidity *float64
	var recordedAt *time.Time

	err := row.Scan(
		&m.ID, &m.Name, &m.Subtitle, &m.Lat, &m.Lng,
		&m.PM25Base, &m.PM10Base, &m.TempBase, &m.HumBase,
		&pm25, &pm10, &temp, &humidity, &recordedAt,
	)
	if err != nil {
		return model.Station{}, err
	}

	if pm25 == nil || recordedAt == nil {
		now := time.Now()
		r := model.Reading{
			StationID:  m.ID,
			PM25:       m.PM25Base,
			PM10:       m.PM10Base,
			Temp:       m.TempBase,
			Humidity:   m.HumBase,
			RecordedAt: now,
		}
		return buildStation(m, r, false), nil
	}

	r := model.Reading{
		StationID:  m.ID,
		PM25:       *pm25,
		PM10:       *pm10,
		Temp:       *temp,
		Humidity:   *humidity,
		RecordedAt: *recordedAt,
	}
	return buildStation(m, r, isOnline(*recordedAt, staleAfter)), nil
}
