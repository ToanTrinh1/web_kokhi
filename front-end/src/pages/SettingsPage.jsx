import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { fetchSettings, testTelegram, updateSettings } from '../services/stationApi'
import './SettingsPage.css'

export default function SettingsPage() {
  const [form, setForm] = useState({
    pm25_warning: 35,
    pm25_critical: 55,
    aqi_warning: 50,
    aqi_critical: 100,
    telegram_enabled: false,
    telegram_chat_id: '',
    telegram_ready: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSettings()
      .then(setForm)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleNumberChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: Number(value) }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const updated = await updateSettings(form)
      setForm(updated)
      setMessage('Đã lưu cài đặt.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTestTelegram = async () => {
    setTesting(true)
    setMessage(null)
    setError(null)
    try {
      await testTelegram(form.telegram_chat_id)
      setMessage('Đã gửi tin test Telegram — kiểm tra điện thoại.')
    } catch (err) {
      setError(err.message)
    } finally {
      setTesting(false)
    }
  }

  return (
    <main className="dashboard-main">
      <Header title="CÀI ĐẶT HỆ THỐNG" />

      {loading && <div className="api-banner">Đang tải…</div>}
      {error && <div className="api-banner api-banner-error">{error}</div>}
      {message && <div className="api-banner api-banner-live">{message}</div>}

      <form className="settings-form" onSubmit={handleSave}>
        <section className="settings-section">
          <h2>PM2.5 (µg/m³)</h2>
          <p className="settings-hint">Vượt ngưỡng → cảnh báo dashboard, History và Telegram.</p>
          <label>
            Cảnh báo (vàng)
            <input
              type="number"
              step="0.1"
              value={form.pm25_warning}
              onChange={(e) => handleNumberChange('pm25_warning', e.target.value)}
            />
          </label>
          <label>
            Nguy hiểm (đỏ)
            <input
              type="number"
              step="0.1"
              value={form.pm25_critical}
              onChange={(e) => handleNumberChange('pm25_critical', e.target.value)}
            />
          </label>
        </section>

        <section className="settings-section">
          <h2>AQI</h2>
          <label>
            Cảnh báo (vàng)
            <input
              type="number"
              value={form.aqi_warning}
              onChange={(e) => handleNumberChange('aqi_warning', e.target.value)}
            />
          </label>
          <label>
            Nguy hiểm (đỏ)
            <input
              type="number"
              value={form.aqi_critical}
              onChange={(e) => handleNumberChange('aqi_critical', e.target.value)}
            />
          </label>
        </section>

        <section className="settings-section">
          <h2>Telegram Alert</h2>
          <p className="settings-hint">
            Token bot đặt trong biến môi trường <code>TELEGRAM_BOT_TOKEN</code> trên server.
            Tạo bot qua @BotFather, lấy Chat ID từ @userinfobot.
          </p>
          {!form.telegram_ready && (
            <p className="settings-warn">
              Server chưa có TELEGRAM_BOT_TOKEN hoặc chưa nhập Chat ID.
            </p>
          )}
          <label className="settings-checkbox">
            <input
              type="checkbox"
              checked={form.telegram_enabled}
              onChange={(e) => handleChange('telegram_enabled', e.target.checked)}
            />
            Bật gửi cảnh báo qua Telegram
          </label>
          <label>
            Chat ID
            <input
              type="text"
              placeholder="123456789"
              value={form.telegram_chat_id}
              onChange={(e) => handleChange('telegram_chat_id', e.target.value)}
            />
          </label>
          <button
            type="button"
            className="settings-test-btn"
            onClick={handleTestTelegram}
            disabled={testing || !form.telegram_chat_id}
          >
            {testing ? 'Đang gửi…' : 'Gửi tin test Telegram'}
          </button>
        </section>

        <button type="submit" className="settings-save" disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu cài đặt'}
        </button>
      </form>
    </main>
  )
}
