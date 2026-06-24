package handler

// ErrorResponse is a standard API error payload.
type ErrorResponse struct {
	Error string `json:"error" example:"invalid JSON body"`
}

// HealthResponse is returned by GET /health.
type HealthResponse struct {
	Status string `json:"status" example:"ok"`
	Mode   string `json:"mode" example:"simulator"`
	DB     string `json:"db" example:"postgres"`
}

// TelegramTestRequest is the body for POST /api/telegram/test.
type TelegramTestRequest struct {
	ChatID string `json:"chat_id" example:"123456789"`
}

// TelegramTestResponse is returned after a successful Telegram test.
type TelegramTestResponse struct {
	Status string `json:"status" example:"sent"`
}

// Health godoc
// @Summary      Health check
// @Description  Kiểm tra trạng thái API và kết nối PostgreSQL
// @Tags         system
// @Produce      json
// @Success      200 {object} HealthResponse
// @Router       /health [get]
func HealthDoc() {}

// ListStations godoc
// @Summary      Danh sách trạm
// @Description  Trả về tất cả trạm với chỉ số AQI, PM2.5 và gauge mới nhất
// @Tags         stations
// @Produce      json
// @Success      200 {array} model.Station
// @Failure      500 {object} ErrorResponse
// @Router       /api/stations [get]
func ListStationsDoc() {}

// GetStation godoc
// @Summary      Chi tiết một trạm
// @Tags         stations
// @Produce      json
// @Param        id path int true "Station ID (1-3)"
// @Success      200 {object} model.Station
// @Failure      400 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Router       /api/stations/{id} [get]
func GetStationDoc() {}

// StationHistory godoc
// @Summary      Lịch sử đo của trạm
// @Tags         stations
// @Produce      json
// @Param        id    path  int true  "Station ID (1-3)"
// @Param        hours query int false "Số giờ lùi lại" default(24)
// @Success      200 {array} model.HistoryPoint
// @Failure      404 {object} ErrorResponse
// @Router       /api/stations/{id}/history [get]
func StationHistoryDoc() {}

// PostReading godoc
// @Summary      Ghi nhận dữ liệu cảm biến (ESP32)
// @Description  Nhận bản ghi PM2.5/PM10 từ thiết bị. Yêu cầu header X-Station-Key khi STATION_API_KEY được cấu hình.
// @Tags         readings
// @Accept       json
// @Produce      json
// @Param        X-Station-Key header string false "API key trạm (bắt buộc nếu server có STATION_API_KEY)"
// @Param        body body model.ReadingInput true "Dữ liệu đo"
// @Success      201 {object} model.Station
// @Failure      400 {object} ErrorResponse
// @Failure      401 {object} ErrorResponse
// @Failure      404 {object} ErrorResponse
// @Security     StationKey
// @Router       /api/readings [post]
func PostReadingDoc() {}

// ListReadingLog godoc
// @Summary      Nhật ký bản ghi đo
// @Tags         readings
// @Produce      json
// @Param        station_id query int false "Lọc theo trạm"
// @Param        hours      query int false "Số giờ lùi lại" default(24)
// @Param        limit      query int false "Giới hạn số dòng" default(200)
// @Success      200 {array} model.ReadingLog
// @Failure      500 {object} ErrorResponse
// @Router       /api/readings [get]
func ListReadingLogDoc() {}

// GetSettings godoc
// @Summary      Lấy cấu hình cảnh báo
// @Tags         settings
// @Produce      json
// @Success      200 {object} model.Settings
// @Failure      500 {object} ErrorResponse
// @Router       /api/settings [get]
func GetSettingsDoc() {}

// PutSettings godoc
// @Summary      Cập nhật cấu hình cảnh báo
// @Tags         settings
// @Accept       json
// @Produce      json
// @Param        body body model.Settings true "Ngưỡng PM2.5/AQI và Telegram"
// @Success      200 {object} model.Settings
// @Failure      400 {object} ErrorResponse
// @Failure      500 {object} ErrorResponse
// @Router       /api/settings [put]
func PutSettingsDoc() {}

// ListAlerts godoc
// @Summary      Danh sách cảnh báo
// @Tags         alerts
// @Produce      json
// @Param        station_id query int false "Lọc theo trạm"
// @Param        hours      query int false "Số giờ lùi lại" default(24)
// @Success      200 {array} model.Alert
// @Failure      500 {object} ErrorResponse
// @Router       /api/alerts [get]
func ListAlertsDoc() {}

// SystemStatus godoc
// @Summary      Trạng thái hệ thống
// @Tags         system
// @Produce      json
// @Success      200 {object} model.SystemStatus
// @Failure      500 {object} ErrorResponse
// @Router       /api/system/status [get]
func SystemStatusDoc() {}

// Heatmap godoc
// @Summary      Điểm heatmap
// @Description  Tọa độ và PM2.5/AQI theo thời gian cho bản đồ nhiệt
// @Tags         analytics
// @Produce      json
// @Param        hours query int false "Số giờ lùi lại" default(6)
// @Success      200 {array} model.HeatmapPoint
// @Failure      500 {object} ErrorResponse
// @Router       /api/heatmap [get]
func HeatmapDoc() {}

// ReadingStats godoc
// @Summary      Thống kê bản ghi đo
// @Tags         analytics
// @Produce      json
// @Param        hours query int false "Số giờ lùi lại" default(24)
// @Success      200 {array} model.ReadingStats
// @Failure      500 {object} ErrorResponse
// @Router       /api/stats/readings [get]
func ReadingStatsDoc() {}

// ListForecast godoc
// @Summary      Dự báo PM2.5 / AQI
// @Description  Dự báo theo hồi quy tuyến tính; bao gồm health_advice và risk_level
// @Tags         analytics
// @Produce      json
// @Param        steps query int false "Số bước dự báo" default(6)
// @Success      200 {array} forecast.Result
// @Failure      500 {object} ErrorResponse
// @Router       /api/forecast [get]
func ListForecastDoc() {}

// TestTelegram godoc
// @Summary      Gửi tin nhắn Telegram thử
// @Tags         settings
// @Accept       json
// @Produce      json
// @Param        body body TelegramTestRequest false "Chat ID (tùy chọn, mặc định dùng cấu hình)"
// @Success      200 {object} TelegramTestResponse
// @Failure      400 {object} ErrorResponse
// @Router       /api/telegram/test [post]
func TestTelegramDoc() {}

// WebSocketStations godoc
// @Summary      WebSocket cập nhật trạm realtime
// @Description  Kết nối WebSocket tại ws://host/ws/stations. Server broadcast JSON: `{"type":"stations","data":[...]}`
// @Tags         realtime
// @Router       /ws/stations [get]
func WebSocketStationsDoc() {}
