package spatial

import (
	"math"

	"github.com/web-kokhi/backend/internal/aqi"
)

type StationPoint struct {
	ID   int
	Lat  float64
	Lng  float64
	PM25 float64
}

type GridCell struct {
	Lat  float64 `json:"lat"`
	Lng  float64 `json:"lng"`
	PM25 float64 `json:"pm25"`
	AQI  int     `json:"aqi"`
}

type GridResult struct {
	Bounds   [4]float64 `json:"bounds"` // south, west, north, east
	Rows     int        `json:"rows"`
	Cols     int        `json:"cols"`
	Cells    []GridCell `json:"cells"`
	Wind     *WindShift `json:"wind,omitempty"`
}

type WindShift struct {
	SpeedKmh    float64 `json:"speed_kmh"`
	DirectionDeg float64 `json:"direction_deg"`
	ShiftLat    float64 `json:"shift_lat"`
	ShiftLng    float64 `json:"shift_lng"`
}

// ComputeGrid IDW interpolation over a lat/lng bounding box.
func ComputeGrid(stations []StationPoint, south, west, north, east float64, rows, cols int, power float64, wind *WindShift) GridResult {
	if rows <= 0 {
		rows = 40
	}
	if cols <= 0 {
		cols = 40
	}
	if power <= 0 {
		power = 2
	}

	latStep := (north - south) / float64(rows)
	lngStep := (east - west) / float64(cols)

	cells := make([]GridCell, 0, rows*cols)
	for ri := 0; ri < rows; ri++ {
		for ci := 0; ci < cols; ci++ {
			lat := south + latStep*(float64(ri)+0.5)
			lng := west + lngStep*(float64(ci)+0.5)
			if wind != nil {
				lat += wind.ShiftLat
				lng += wind.ShiftLng
			}
			pm := idwPM25(lat, lng, stations, power)
			aqiVal, _, _ := aqi.FromPM25(pm)
			cells = append(cells, GridCell{Lat: round5(lat), Lng: round5(lng), PM25: round1(pm), AQI: aqiVal})
		}
	}

	return GridResult{
		Bounds: [4]float64{south, west, north, east},
		Rows:   rows,
		Cols:   cols,
		Cells:  cells,
		Wind:   wind,
	}
}

func idwPM25(lat, lng float64, stations []StationPoint, power float64) float64 {
	if len(stations) == 0 {
		return 0
	}
	var num, den float64
	for _, s := range stations {
		d := haversineKm(lat, lng, s.Lat, s.Lng)
		if d < 0.05 {
			return s.PM25
		}
		w := 1 / math.Pow(d, power)
		num += w * s.PM25
		den += w
	}
	if den == 0 {
		return 0
	}
	return num / den
}

func haversineKm(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371.0
	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*math.Sin(dLng/2)*math.Sin(dLng/2)
	return 2 * R * math.Asin(math.Sqrt(a))
}

func round1(v float64) float64 {
	return math.Round(v*10) / 10
}

func round5(v float64) float64 {
	return math.Round(v*1e5) / 1e5
}

// WindPlumeShift approximates downwind displacement for visualization (degrees).
func WindPlumeShift(speedKmh, directionDeg float64, hours float64) (dLat, dLng float64) {
	if speedKmh <= 0 || hours <= 0 {
		return 0, 0
	}
	// ~111 km per degree latitude; scale lightly for map overlay
	km := speedKmh * hours * 0.15
	rad := (directionDeg - 90) * math.Pi / 180
	dLat = (km / 111) * math.Sin(rad)
	dLng = (km / 111) * math.Cos(rad) / math.Cos(10.78*math.Pi/180)
	return dLat, dLng
}
