# Web Kokhi — Fake API Backend (Go)

Simulates ESP32 air-quality readings for local development without hardware.

## Run

```bash
cd backend
go run ./cmd/server
```

Server default: `http://localhost:8080`

## Docker

From project root (`web_kokhi/`):

```bash
docker compose up --build -d
docker compose logs -f backend
curl http://localhost:8080/health
```

Includes **PostgreSQL 16** — data persisted in Docker volume `pgdata`.

Stop (keep data):

```bash
docker compose down
```

Stop and remove DB volume:

```bash
docker compose down -v
```

## PostgreSQL

Schema (auto-migrate on startup):

- `stations` — TRAM metadata + simulator baselines
- `readings` — time-series PM2.5, PM10, temp, humidity (ESP32 POST writes here)

Connection string:

```env
DATABASE_URL=postgres://web_kokhi:web_kokhi@localhost:5432/web_kokhi?sslmode=disable
```

Local dev with Docker Postgres only:

```bash
docker compose up -d postgres
cd backend
export DATABASE_URL=postgres://web_kokhi:web_kokhi@localhost:5432/web_kokhi?sslmode=disable
go run ./cmd/server
```

Environment:

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `8080` | Host port mapped to container |
| `SIMULATOR_INTERVAL_SEC` | `5` | Fake sensor tick interval |

Server environment:

| Variable | Default | Description |
|----------|---------|-------------|
| `ADDR` | `:8080` | Listen address |
| `SIMULATOR_INTERVAL_SEC` | `5` | Fake sensor tick interval |

## API

Swagger UI: **http://localhost:8080/swagger/index.html**

Regenerate docs after changing annotations in `internal/handler/doc.go`:

```bash
cd backend
~/go/bin/swag init -g cmd/server/main.go -o internal/docs --parseDependency --parseInternal
```

### `GET /health`

### `GET /api/stations`

Returns all stations with latest AQI, PM2.5, gauges (matches React dashboard shape).

### `GET /api/stations/:id`

Single station.

### `GET /api/stations/:id/history?hours=24`

Chart points: `{ "time", "pm25", "pm10" }[]`

### `POST /api/readings`

ESP32-compatible ingest (header `X-Station-Key` when `STATION_API_KEY` is set):

```json
{
  "station_id": 1,
  "pm25": 11.2,
  "pm10": 38.0,
  "temp": 26.5,
  "humidity": 65,
  "firmware": "1.0.0",
  "rssi": -65
}
```

### `WS /ws/stations`

Real-time station updates (JSON `{ "type": "stations", "data": [...] }`).

Forecast responses include `health_advice` and `risk_level`.

## Test with curl

```bash
curl http://localhost:8080/api/stations
curl http://localhost:8080/api/stations/1/history?hours=24
curl -X POST http://localhost:8080/api/readings \
  -H 'Content-Type: application/json' \
  -d '{"station_id":1,"pm25":15,"pm10":40,"temp":27,"humidity":60}'
```
