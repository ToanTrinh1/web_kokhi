package db

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type seedStation struct {
	ID       int
	Name     string
	Subtitle string
	Lat      float64
	Lng      float64
	PM25Base float64
	PM10Base float64
	TempBase float64
	HumBase  float64
}

var defaultStations = []seedStation{
	{ID: 1, Name: "TRAM 1", Subtitle: "TRAM DO", Lat: 10.782, Lng: 106.698, PM25Base: 11.2, PM10Base: 38, TempBase: 26.5, HumBase: 65},
	{ID: 2, Name: "TRAM 2", Subtitle: "TRAM DO", Lat: 10.788, Lng: 106.712, PM25Base: 28.4, PM10Base: 62, TempBase: 28.1, HumBase: 58},
	{ID: 3, Name: "TRAM 3", Subtitle: "TRAM DO", Lat: 10.768, Lng: 106.705, PM25Base: 19.6, PM10Base: 45, TempBase: 27.3, HumBase: 62},
}

func SeedIfEmpty(ctx context.Context, pool *pgxpool.Pool) error {
	var n int
	if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM stations`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}

	for _, s := range defaultStations {
		_, err := pool.Exec(ctx, `
			INSERT INTO stations (id, name, subtitle, lat, lng, pm25_base, pm10_base, temp_base, hum_base)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			s.ID, s.Name, s.Subtitle, s.Lat, s.Lng, s.PM25Base, s.PM10Base, s.TempBase, s.HumBase,
		)
		if err != nil {
			return err
		}
	}

	now := time.Now()
	for _, s := range defaultStations {
		for i := 35; i >= 0; i-- {
			t := now.Add(-time.Duration(i*5) * time.Minute)
			hour := float64(t.Hour())
			wave := 1 + 0.15*float64((hour-7)*(hour-7))/49
			pm25 := s.PM25Base * wave
			pm10 := s.PM10Base * wave
			_, err := pool.Exec(ctx, `
				INSERT INTO readings (station_id, pm25, pm10, temp, humidity, recorded_at)
				VALUES ($1, $2, $3, $4, $5, $6)`,
				s.ID, pm25, pm10, s.TempBase+0.3*float64(i%5), s.HumBase+float64(i%7), t,
			)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
