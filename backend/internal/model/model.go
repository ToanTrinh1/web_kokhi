package model

import "time"

type Gauge struct {
	Type  string  `json:"type"`
	Value float64 `json:"value"`
	Max   float64 `json:"max"`
}

type Station struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Subtitle  string  `json:"subtitle"`
	Online    bool    `json:"online"`
	Time      string  `json:"time"`
	AQI       int     `json:"aqi"`
	AQILabel  string  `json:"aqiLabel"`
	PM25      float64 `json:"pm25"`
	Temp      float64 `json:"temp"`
	Humidity  float64 `json:"humidity"`
	Lat       float64 `json:"lat"`
	Lng       float64 `json:"lng"`
	Color     string  `json:"color"`
	Gauges    []Gauge `json:"gauges"`
	UpdatedAt time.Time `json:"-"`
	LastSeen  *time.Time `json:"last_seen,omitempty"`
}

type Reading struct {
	StationID int       `json:"station_id"`
	PM25      float64   `json:"pm25"`
	PM10      float64   `json:"pm10"`
	Temp      float64   `json:"temp"`
	Humidity  float64   `json:"humidity"`
	RecordedAt time.Time `json:"recorded_at"`
}

type ReadingInput struct {
	StationID int     `json:"station_id"`
	PM25      float64 `json:"pm25"`
	PM10      float64 `json:"pm10"`
	Temp      float64 `json:"temp"`
	Humidity  float64 `json:"humidity"`
	Firmware  string  `json:"firmware,omitempty"`
	RSSI      *int    `json:"rssi,omitempty"`
}

type HistoryPoint struct {
	Time string  `json:"time"`
	PM25 float64 `json:"pm25"`
	PM10 float64 `json:"pm10"`
}

type StationMeta struct {
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

type Settings struct {
	PM25Warning      float64 `json:"pm25_warning"`
	PM25Critical     float64 `json:"pm25_critical"`
	AQIWarning       int     `json:"aqi_warning"`
	AQICritical      int     `json:"aqi_critical"`
	TelegramEnabled  bool    `json:"telegram_enabled"`
	TelegramChatID   string  `json:"telegram_chat_id"`
	TelegramReady    bool    `json:"telegram_ready"`
}

type Alert struct {
	ID          int64     `json:"id"`
	StationID   int       `json:"station_id"`
	StationName string    `json:"station_name"`
	Metric      string    `json:"metric"`
	Level       string    `json:"level"`
	Value       float64   `json:"value"`
	Message     string    `json:"message"`
	CreatedAt   time.Time `json:"created_at"`
}

type ReadingLog struct {
	ID          int64     `json:"id"`
	StationID   int       `json:"station_id"`
	StationName string    `json:"station_name"`
	PM25        float64   `json:"pm25"`
	PM10        float64   `json:"pm10"`
	Temp        float64   `json:"temp"`
	Humidity    float64   `json:"humidity"`
	AQI         int       `json:"aqi"`
	QualityFlag string    `json:"quality_flag,omitempty"`
	RecordedAt  time.Time `json:"recorded_at"`
}

type StationStatus struct {
	ID       int        `json:"id"`
	Name     string     `json:"name"`
	Online   bool       `json:"online"`
	LastSeen *time.Time `json:"last_seen,omitempty"`
	LastPM25 float64    `json:"last_pm25"`
	LastAQI  int        `json:"last_aqi"`
}

type SystemStatus struct {
	APIStatus       string          `json:"api_status"`
	DBStatus        string          `json:"db_status"`
	Mode            string          `json:"mode"`
	StartedAt       time.Time       `json:"started_at"`
	UptimeSec       int64           `json:"uptime_sec"`
	StationsTotal   int             `json:"stations_total"`
	StationsOnline  int             `json:"stations_online"`
	ReadingsToday   int64           `json:"readings_today"`
	AlertsToday     int64           `json:"alerts_today"`
	StaleThresholdS int             `json:"stale_threshold_sec"`
	Stations        []StationStatus `json:"stations"`
}

type HeatmapPoint struct {
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	PM25        float64   `json:"pm25"`
	AQI         int       `json:"aqi"`
	StationID   int       `json:"station_id"`
	StationName string    `json:"station_name"`
	RecordedAt  time.Time `json:"recorded_at"`
}

type ReadingStats struct {
	StationID   int     `json:"station_id"`
	StationName string  `json:"station_name"`
	Count       int64   `json:"count"`
	PM25Min     float64 `json:"pm25_min"`
	PM25Max     float64 `json:"pm25_max"`
	PM25Avg     float64 `json:"pm25_avg"`
	PM10Min     float64 `json:"pm10_min"`
	PM10Max     float64 `json:"pm10_max"`
	PM10Avg     float64 `json:"pm10_avg"`
	AQIMin      int     `json:"aqi_min"`
	AQIMax      int     `json:"aqi_max"`
	AQIAvg      int     `json:"aqi_avg"`
	TempMin     float64 `json:"temp_min"`
	TempMax     float64 `json:"temp_max"`
	TempAvg     float64 `json:"temp_avg"`
	HumidityMin float64 `json:"humidity_min"`
	HumidityMax float64 `json:"humidity_max"`
	HumidityAvg float64 `json:"humidity_avg"`
}
