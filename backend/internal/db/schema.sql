CREATE TABLE IF NOT EXISTS stations (
    id          INT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    subtitle    VARCHAR(100) NOT NULL DEFAULT '',
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    pm25_base   DOUBLE PRECISION NOT NULL,
    pm10_base   DOUBLE PRECISION NOT NULL,
    temp_base   DOUBLE PRECISION NOT NULL,
    hum_base    DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS readings (
    id          BIGSERIAL PRIMARY KEY,
    station_id  INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    pm25        DOUBLE PRECISION NOT NULL,
    pm10        DOUBLE PRECISION NOT NULL,
    temp        DOUBLE PRECISION NOT NULL,
    humidity    DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_readings_station_recorded
    ON readings (station_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS settings (
    id             INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    pm25_warning   DOUBLE PRECISION NOT NULL DEFAULT 35,
    pm25_critical  DOUBLE PRECISION NOT NULL DEFAULT 55,
    aqi_warning    INT NOT NULL DEFAULT 50,
    aqi_critical   INT NOT NULL DEFAULT 100
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(64) NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS alerts (
    id          BIGSERIAL PRIMARY KEY,
    station_id  INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    metric      VARCHAR(20) NOT NULL,
    level       VARCHAR(20) NOT NULL,
    value       DOUBLE PRECISION NOT NULL,
    message     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_station_created
    ON alerts (station_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_created
    ON alerts (created_at DESC);

-- ─── Extended features (v2) ───────────────────────────────────────────

ALTER TABLE stations ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE stations ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(32) NOT NULL DEFAULT '';
ALTER TABLE stations ADD COLUMN IF NOT EXISTS api_key VARCHAR(64) NOT NULL DEFAULT '';

ALTER TABLE readings ADD COLUMN IF NOT EXISTS quality_flag VARCHAR(20) NOT NULL DEFAULT 'ok';
ALTER TABLE readings ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(32) NOT NULL DEFAULT '';
ALTER TABLE readings ADD COLUMN IF NOT EXISTS rssi INT;
ALTER TABLE readings ADD COLUMN IF NOT EXISTS source_ip INET;

CREATE TABLE IF NOT EXISTS reading_audit (
    id          BIGSERIAL PRIMARY KEY,
    reading_id  BIGINT,
    station_id  INT NOT NULL,
    payload_hash CHAR(64) NOT NULL,
    source_ip   INET,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_audit_station
    ON reading_audit (station_id, ingested_at DESC);
