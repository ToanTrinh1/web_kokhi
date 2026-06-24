package store

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net"

	"github.com/web-kokhi/backend/internal/anomaly"
)

type Broadcaster interface {
	Broadcast(v any)
}

func (s *Store) SetBroadcaster(b Broadcaster) {
	s.broadcaster = b
}

func (s *Store) notifyStations() {
	if s.broadcaster == nil {
		return
	}
	list, err := s.ListStations()
	if err != nil {
		return
	}
	s.broadcaster.Broadcast(map[string]any{"type": "stations", "data": list})
}

func (s *Store) classifyReading(stationID int, pm25 float64) string {
	recent, err := s.recentReadings(stationID, 12)
	if err != nil {
		return anomaly.QualityOK
	}
	samples := make([]anomaly.ReadingSample, len(recent))
	for i, r := range recent {
		samples[i] = anomaly.ReadingSample{PM25: r.PM25}
	}
	peerMedian := s.peerMedianPM25(stationID)
	return anomaly.Classify(pm25, samples, peerMedian)
}

func (s *Store) peerMedianPM25(excludeID int) float64 {
	stations, err := s.ListStations()
	if err != nil {
		return 0
	}
	vals := make([]float64, 0, len(stations))
	for _, st := range stations {
		if st.ID != excludeID && st.PM25 > 0 {
			vals = append(vals, st.PM25)
		}
	}
	if len(vals) == 0 {
		return 0
	}
	for i := 0; i < len(vals); i++ {
		for j := i + 1; j < len(vals); j++ {
			if vals[j] < vals[i] {
				vals[i], vals[j] = vals[j], vals[i]
			}
		}
	}
	return vals[len(vals)/2]
}

func (s *Store) auditReading(readingID int64, stationID int, payload string, sourceIP string) {
	ctx := context.Background()
	sum := sha256.Sum256([]byte(payload))
	hash := hex.EncodeToString(sum[:])
	var ip any
	if sourceIP != "" {
		ip = net.ParseIP(sourceIP)
	}
	_, _ = s.pool.Exec(ctx, `
		INSERT INTO reading_audit (reading_id, station_id, payload_hash, source_ip)
		VALUES ($1, $2, $3, $4)`, readingID, stationID, hash, ip)
}
