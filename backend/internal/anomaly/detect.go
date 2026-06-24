package anomaly

import "math"

const (
	QualityOK      = "ok"
	QualitySuspect = "suspect"
	QualityInvalid = "invalid"
)

type ReadingSample struct {
	PM25 float64
}

// Classify flags flatline, spike, or negative values.
func Classify(current float64, recent []ReadingSample, peerMedian float64) string {
	if current < 0 || current > 500 {
		return QualityInvalid
	}
	if len(recent) >= 6 {
		flat := true
		first := recent[len(recent)-1].PM25
		for _, r := range recent[len(recent)-6:] {
			if math.Abs(r.PM25-first) > 0.3 {
				flat = false
				break
			}
		}
		if flat {
			return QualitySuspect
		}
	}
	if len(recent) >= 3 {
		var sum float64
		for _, r := range recent {
			sum += r.PM25
		}
		mean := sum / float64(len(recent))
		var varSum float64
		for _, r := range recent {
			d := r.PM25 - mean
			varSum += d * d
		}
		std := math.Sqrt(varSum / float64(len(recent)))
		if std > 0 && math.Abs(current-mean) > 3*std {
			return QualitySuspect
		}
	}
	if peerMedian > 0 && current > peerMedian*2.5 && current > 40 {
		return QualitySuspect
	}
	return QualityOK
}
