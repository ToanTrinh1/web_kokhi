// @title           Web Kokhi API
// @version         1.0
// @description     API giám sát chất lượng không khí — trạm đo, cảnh báo, dự báo và thống kê.
// @host            localhost:8080
// @BasePath        /
// @schemes         http
//
// @securityDefinitions.apikey StationKey
// @in header
// @name X-Station-Key
// @description     API key cho POST /api/readings (khi biến môi trường STATION_API_KEY được đặt)
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	httpSwagger "github.com/swaggo/http-swagger"
	"github.com/web-kokhi/backend/internal/db"
	_ "github.com/web-kokhi/backend/internal/docs"
	"github.com/web-kokhi/backend/internal/handler"
	"github.com/web-kokhi/backend/internal/middleware"
	"github.com/web-kokhi/backend/internal/notify"
	"github.com/web-kokhi/backend/internal/simulator"
	"github.com/web-kokhi/backend/internal/store"
	"github.com/web-kokhi/backend/internal/ws"
)

func main() {
	addr := env("ADDR", ":8080")
	tickSec := envInt("SIMULATOR_INTERVAL_SEC", 5)
	databaseURL := env("DATABASE_URL", "postgres://web_kokhi:web_kokhi@localhost:5432/web_kokhi?sslmode=disable")
	apiKey := env("STATION_API_KEY", "")

	ctx := context.Background()
	pool, err := db.Wait(ctx, databaseURL, 30, 2*time.Second)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	if err := db.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := db.SeedIfEmpty(ctx, pool); err != nil {
		log.Fatalf("seed: %v", err)
	}

	hub := ws.NewHub()
	st := store.New(pool, notify.NewClient(env("TELEGRAM_BOT_TOKEN", "")))
	st.SetBroadcaster(hub)
	startedAt := time.Now()
	h := &handler.Handler{
		Store:     st,
		StartedAt: startedAt,
		APIKey:    apiKey,
	}

	stop := make(chan struct{})
	go simulator.Run(st, time.Duration(tickSec)*time.Second, stop)
	defer close(stop)

	mux := http.NewServeMux()
	mux.HandleFunc("/swagger", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/index.html", http.StatusMovedPermanently)
	})
	mux.Handle("/swagger/", httpSwagger.WrapHandler)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		h.Health(w, r, pool)
	})
	mux.Handle("/ws/stations", hub)
	mux.HandleFunc("/api/stations", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeMethodNotAllowed(w)
			return
		}
		h.ListStations(w, r)
	})
	mux.HandleFunc("/api/stations/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeMethodNotAllowed(w)
			return
		}
		h.GetStation(w, r)
	})
	mux.HandleFunc("/api/readings", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost:
			h.PostReading(w, r)
		case http.MethodGet:
			h.ListReadingLog(w, r)
		default:
			writeMethodNotAllowed(w)
		}
	})
	mux.HandleFunc("/api/settings", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.GetSettings(w, r)
		case http.MethodPut:
			h.PutSettings(w, r)
		default:
			writeMethodNotAllowed(w)
		}
	})
	mux.HandleFunc("/api/alerts", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeMethodNotAllowed(w)
			return
		}
		h.ListAlerts(w, r)
	})
	mux.HandleFunc("/api/system/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeMethodNotAllowed(w)
			return
		}
		h.SystemStatus(w, r)
	})
	mux.HandleFunc("/api/heatmap", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeMethodNotAllowed(w)
			return
		}
		h.Heatmap(w, r)
	})
	mux.HandleFunc("/api/stats/readings", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeMethodNotAllowed(w)
			return
		}
		h.ReadingStats(w, r)
	})
	mux.HandleFunc("/api/forecast", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeMethodNotAllowed(w)
			return
		}
		h.ListForecast(w, r)
	})
	mux.HandleFunc("/api/telegram/test", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeMethodNotAllowed(w)
			return
		}
		h.TestTelegram(w, r)
	})

	log.Printf("web-kokhi API listening on %s (postgres + simulator every %ds)", addr, tickSec)
	log.Printf("  GET  /api/stations")
	log.Printf("  GET  /api/stations/:id/history")
	log.Printf("  GET  /api/readings?hours=24  (history log)")
	log.Printf("  GET  /api/alerts")
	log.Printf("  GET  /api/system/status")
	log.Printf("  GET  /api/heatmap?hours=6")
	log.Printf("  GET  /api/stats/readings?hours=24")
	log.Printf("  GET  /api/forecast?steps=6")
	log.Printf("  POST /api/telegram/test")
	log.Printf("  GET/PUT /api/settings")
	log.Printf("  POST /api/readings")
	log.Printf("  WS   /ws/stations")
	log.Printf("  GET  /swagger/index.html")

	if err := http.ListenAndServe(addr, middleware.CORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func env(key, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	var n int
	if _, err := fmt.Sscanf(v, "%d", &n); err != nil || n <= 0 {
		return fallback
	}
	return n
}

func writeMethodNotAllowed(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusMethodNotAllowed)
	_, _ = w.Write([]byte(`{"error":"method not allowed"}`))
}
