package simulator

import (
	"math"
	"math/rand"
	"time"

	"github.com/web-kokhi/backend/internal/model"
	"github.com/web-kokhi/backend/internal/store"
)

// Run ticks fake ESP32 readings until stop is closed.
func Run(st *store.Store, interval time.Duration, stop <-chan struct{}) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	for {
		select {
		case <-stop:
			return
		case t := <-ticker.C:
			tickAll(st, rng, t)
		}
	}
}

func tickAll(st *store.Store, rng *rand.Rand, now time.Time) {
	hour := float64(now.Hour())
	// Morning rush: higher PM 6–9h
	rush := 1.0
	if hour >= 6 && hour <= 9 {
		rush = 1.25
	} else if hour >= 17 && hour <= 20 {
		rush = 1.15
	}

	for id := 1; id <= 3; id++ {
		meta, ok := st.Meta(id)
		if !ok {
			continue
		}

		noisePM := (rng.Float64() - 0.5) * 4
		noiseTemp := (rng.Float64() - 0.5) * 0.8
		noiseHum := (rng.Float64() - 0.5) * 3

		// Occasional spike (~5%) to test alerts in UI.
		if rng.Float64() < 0.05 {
			noisePM += 8 + rng.Float64()*12
		}

		stationBias := 1.0 + float64(id-1)*0.08
		pm25 := math.Max(2, meta.PM25Base*rush*stationBias+noisePM)
		pm10 := math.Max(pm25*1.4, meta.PM10Base*rush*stationBias+noisePM*1.2)

		r := model.Reading{
			StationID:  id,
			PM25:       pm25,
			PM10:       pm10,
			Temp:       meta.TempBase + noiseTemp,
			Humidity:   clamp(meta.HumBase+noiseHum, 30, 95),
			RecordedAt: now,
		}
		if err := st.ApplySimulatedReading(id, r); err != nil {
			// logged in production; simulator keeps running
			_ = err
		}
	}
}

func clamp(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
