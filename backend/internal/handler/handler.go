package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/web-kokhi/backend/internal/model"
	"github.com/web-kokhi/backend/internal/store"
)

type Handler struct {
	Store     *store.Store
	StartedAt time.Time
	APIKey    string
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request, pool *pgxpool.Pool) {
	status := "ok"
	if err := pool.Ping(r.Context()); err != nil {
		status = "degraded"
	}
	writeJSON(w, http.StatusOK, map[string]string{
		"status": status,
		"mode":   "simulator",
		"db":     "postgres",
	})
}

func (h *Handler) ListStations(w http.ResponseWriter, r *http.Request) {
	list, err := h.Store.ListStations()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *Handler) GetStation(w http.ResponseWriter, r *http.Request) {
	id, err := stationIDFromPath(r.URL.Path, "/api/stations/")
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if strings.HasSuffix(r.URL.Path, "/history") {
		h.StationHistory(w, r, id)
		return
	}

	st, err := h.Store.GetStation(id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, st)
}

func (h *Handler) StationHistory(w http.ResponseWriter, r *http.Request, id int) {
	hours := 24
	if q := r.URL.Query().Get("hours"); q != "" {
		if v, err := strconv.Atoi(q); err == nil && v > 0 {
			hours = v
		}
	}

	points, err := h.Store.GetHistory(id, hours)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, points)
}

func (h *Handler) PostReading(w http.ResponseWriter, r *http.Request) {
	if h.APIKey != "" && r.Header.Get("X-Station-Key") != h.APIKey {
		writeError(w, http.StatusUnauthorized, "invalid or missing X-Station-Key")
		return
	}
	var in model.ReadingInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if in.StationID < 1 || in.StationID > 3 {
		writeError(w, http.StatusBadRequest, "station_id must be 1, 2, or 3")
		return
	}

	sourceIP := r.RemoteAddr
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		sourceIP = strings.Split(fwd, ",")[0]
	}

	st, err := h.Store.ApplyReading(in, strings.TrimSpace(sourceIP))
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, st)
}

func (h *Handler) GetSettings(w http.ResponseWriter, r *http.Request) {
	cfg, err := h.Store.GetSettings()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, cfg)
}

func (h *Handler) PutSettings(w http.ResponseWriter, r *http.Request) {
	var cfg model.Settings
	if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if cfg.PM25Warning <= 0 || cfg.PM25Critical <= cfg.PM25Warning {
		writeError(w, http.StatusBadRequest, "invalid pm25 thresholds")
		return
	}
	if cfg.AQIWarning <= 0 || cfg.AQICritical <= cfg.AQIWarning {
		writeError(w, http.StatusBadRequest, "invalid aqi thresholds")
		return
	}
	updated, err := h.Store.UpdateSettings(cfg)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (h *Handler) ListAlerts(w http.ResponseWriter, r *http.Request) {
	stationID := queryInt(r, "station_id", 0)
	hours := queryInt(r, "hours", 24)
	list, err := h.Store.ListAlerts(stationID, hours)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *Handler) ListReadingLog(w http.ResponseWriter, r *http.Request) {
	stationID := queryInt(r, "station_id", 0)
	hours := queryInt(r, "hours", 24)
	limit := queryInt(r, "limit", 200)
	list, err := h.Store.ListReadingLog(stationID, hours, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *Handler) SystemStatus(w http.ResponseWriter, r *http.Request) {
	status, err := h.Store.GetSystemStatus(h.StartedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if err := h.Store.Pool().Ping(r.Context()); err != nil {
		status.DBStatus = "degraded"
	}
	writeJSON(w, http.StatusOK, status)
}

func (h *Handler) Heatmap(w http.ResponseWriter, r *http.Request) {
	hours := queryInt(r, "hours", 6)
	points, err := h.Store.HeatmapPoints(hours)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, points)
}

func (h *Handler) ReadingStats(w http.ResponseWriter, r *http.Request) {
	hours := queryInt(r, "hours", 24)
	stats, err := h.Store.ReadingStats(hours)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *Handler) ListForecast(w http.ResponseWriter, r *http.Request) {
	steps := queryInt(r, "steps", 6)
	list, err := h.Store.ForecastAll(steps)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *Handler) TestTelegram(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ChatID string `json:"chat_id"`
	}
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&body)
	}
	if err := h.Store.TestTelegram(body.ChatID); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "sent"})
}

func queryInt(r *http.Request, key string, fallback int) int {
	q := r.URL.Query().Get(key)
	if q == "" {
		return fallback
	}
	v, err := strconv.Atoi(q)
	if err != nil || v <= 0 {
		return fallback
	}
	return v
}

func stationIDFromPath(path, prefix string) (int, error) {
	rest := strings.TrimPrefix(path, prefix)
	rest = strings.TrimSuffix(rest, "/history")
	rest = strings.Trim(rest, "/")
	return strconv.Atoi(rest)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
