import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UGANDA_LOCATIONS } from '../hooks/useWeatherData'

const WEATHER_API_KEY = 'cb60f5e160d84029b55112040252711'
const WEATHER_BASE_URL = 'https://api.weatherapi.com/v1'

function analyzeThreats(forecastData, locationName) {
  if (!forecastData?.forecast?.forecastday) return []
  const threats = []
  forecastData.forecast.forecastday.forEach((day) => {
    const date = new Date(day.date)
    const maxTemp = day.day.maxtemp_c
    const minTemp = day.day.mintemp_c
    const totalPrecip = day.day.totalprecip_mm
    const maxWind = day.day.maxwind_kph
    if (maxTemp >= 35) {
      threats.push({
        date: day.date,
        dateFormatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        location: locationName,
        condition: maxTemp >= 38 ? `Extreme heat ${maxTemp.toFixed(0)}°C` : `High temp ${maxTemp.toFixed(0)}°C`,
        severity: maxTemp >= 38 ? 'critical' : 'warning',
        icon: maxTemp >= 38 ? '🔥' : '🌡️',
      })
    }
    if (minTemp <= 12) {
      threats.push({
        date: day.date,
        dateFormatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        location: locationName,
        condition: `Cold ${minTemp.toFixed(0)}°C`,
        severity: 'critical',
        icon: '❄️',
      })
    }
    if (totalPrecip >= 25) {
      threats.push({
        date: day.date,
        dateFormatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        location: locationName,
        condition: totalPrecip >= 50 ? `Heavy rain ${totalPrecip.toFixed(0)}mm` : `Rain ${totalPrecip.toFixed(0)}mm`,
        severity: totalPrecip >= 50 ? 'critical' : 'warning',
        icon: totalPrecip >= 50 ? '🌧️' : '🌦️',
      })
    }
    if (maxWind >= 50) {
      threats.push({
        date: day.date,
        dateFormatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        location: locationName,
        condition: `Strong winds ${maxWind.toFixed(0)} km/h`,
        severity: 'warning',
        icon: '💨',
      })
    }
  })
  return threats.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 7)
}

export default function RecentWeatherAnomalies() {
  const [threats, setThreats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loc = UGANDA_LOCATIONS.kampala || Object.values(UGANDA_LOCATIONS)[0]
    if (!loc) {
      setLoading(false)
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch(
          `${WEATHER_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${loc.query}&days=14&aqi=no&alerts=yes`
        )
        if (!res.ok || cancelled) return
        const data = await res.json()
        const list = analyzeThreats(data, loc.name)
        if (!cancelled) setThreats(list)
      } catch (_) {
        if (!cancelled) setThreats([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <motion.section
        className="chart-card"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="section-header">
          <h3>Recent weather anomalies</h3>
          <p>Loading recent significant weather events…</p>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      className="chart-card recent-anomalies"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="section-header">
        <h3>Recent weather anomalies</h3>
        <p>Most recent significant weather events that may affect water quality and cholera risk.</p>
      </div>
      {threats.length > 0 ? (
        <ul className="recent-anomalies-list">
          {threats.map((t, idx) => (
            <motion.li
              key={`${t.date}-${t.location}-${idx}`}
              className={`recent-anomaly-item ${t.severity}`}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <span className="recent-anomaly-icon">{t.icon}</span>
              <div className="recent-anomaly-content">
                <strong>{t.condition}</strong>
                <span>{t.location} · {t.dateFormatted}</span>
              </div>
              <span className={`recent-anomaly-badge ${t.severity}`}>
                {t.severity === 'critical' ? 'Critical' : 'Warning'}
              </span>
            </motion.li>
          ))}
        </ul>
      ) : (
        <div className="weather-status-ok">
          <span className="status-icon">✅</span>
          <p>No significant weather anomalies in the current 14-day window.</p>
        </div>
      )}
    </motion.section>
  )
}
