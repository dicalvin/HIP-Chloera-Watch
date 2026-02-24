import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import useWeatherData, { UGANDA_LOCATIONS } from '../hooks/useWeatherData'

const WEATHER_API_KEY = 'cb60f5e160d84029b55112040252711'
const WEATHER_BASE_URL = 'https://api.weatherapi.com/v1'

// Extended forecast hook for 2 weeks
function useTwoWeekForecast(location = 'kampala') {
  const [forecastData, setForecastData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loc = UGANDA_LOCATIONS[location] || UGANDA_LOCATIONS.kampala

    const fetchForecast = async () => {
      try {
        // WeatherAPI.com supports up to 14 days forecast
        const response = await fetch(
          `${WEATHER_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${loc.query}&days=14&aqi=no&alerts=yes`
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            `Weather API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
          )
        }

        const data = await response.json()
        setForecastData(data)
        setError('')
      } catch (err) {
        console.error('Forecast fetch error:', err)
        setError(err.message || 'Failed to fetch forecast data')
        setForecastData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
    // Refresh every hour
    const interval = setInterval(fetchForecast, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [location])

  return { forecastData, loading, error }
}

// Analyze extreme weather conditions
function analyzeExtremeConditions(forecastData) {
  if (!forecastData || !forecastData.forecast) return []

  const alerts = []
  const forecastDays = forecastData.forecast.forecastday || []

  forecastDays.forEach((day, index) => {
    const date = new Date(day.date)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const maxTemp = day.day.maxtemp_c
    const minTemp = day.day.mintemp_c
    const avgTemp = day.day.avgtemp_c
    const maxWind = day.day.maxwind_kph
    const totalPrecip = day.day.totalprecip_mm
    const avgHumidity = day.day.avghumidity
    const condition = day.day.condition.text.toLowerCase()

    // Extreme high temperature (38°C+)
    if (maxTemp >= 38) {
      alerts.push({
        date: day.date,
        dayName,
        type: 'extreme_heat',
        severity: 'critical',
        message: `Extreme Heat Warning: ${maxTemp.toFixed(1)}°C`,
        description: `Temperatures reaching ${maxTemp.toFixed(1)}°C can significantly increase water contamination risk and dehydration, accelerating cholera spread.`,
        impact: 'High risk of water contamination, increased dehydration, and rapid disease transmission.',
        recommendations: [
          'Increase water quality monitoring frequency',
          'Ensure adequate water treatment supplies are available',
          'Alert communities about water safety',
          'Prepare for increased case surveillance',
        ],
        temp: maxTemp,
        dayIndex: index,
      })
    } else if (maxTemp >= 35) {
      alerts.push({
        date: day.date,
        dayName,
        type: 'high_temp',
        severity: 'warning',
        message: `High Temperature: ${maxTemp.toFixed(1)}°C`,
        description: `Elevated temperatures increase water contamination risk.`,
        impact: 'Moderate risk of water quality issues.',
        recommendations: [
          'Monitor water sources closely',
          'Ensure water treatment capacity',
        ],
        temp: maxTemp,
        dayIndex: index,
      })
    }

    // Extreme low temperature (12°C or below)
    if (minTemp <= 12) {
      alerts.push({
        date: day.date,
        dayName,
        type: 'extreme_cold',
        severity: 'critical',
        message: `Extreme Cold Warning: ${minTemp.toFixed(1)}°C`,
        description: `Very low temperatures may affect water infrastructure and access.`,
        impact: 'Risk of water infrastructure failure and reduced access to clean water.',
        recommendations: [
          'Check water infrastructure for cold-related issues',
          'Ensure backup water sources are available',
          'Monitor for infrastructure breakdowns',
        ],
        temp: minTemp,
        dayIndex: index,
      })
    }

    // Heavy rainfall (50mm+ in 24h)
    if (totalPrecip >= 50) {
      alerts.push({
        date: day.date,
        dayName,
        type: 'heavy_rain',
        severity: 'critical',
        message: `Heavy Rainfall Warning: ${totalPrecip.toFixed(1)}mm expected`,
        description: `Heavy rainfall can cause flooding and contaminate water sources, significantly increasing cholera risk.`,
        impact: 'High risk of flooding, water source contamination, and rapid disease spread.',
        recommendations: [
          'Activate flood monitoring protocols immediately',
          'Increase water quality testing in flood-prone areas',
          'Prepare emergency water treatment supplies',
          'Alert communities about water safety',
          'Monitor water sources for contamination',
          'Prepare for potential outbreak response',
        ],
        precip: totalPrecip,
        dayIndex: index,
      })
    } else if (totalPrecip >= 25) {
      alerts.push({
        date: day.date,
        dayName,
        type: 'moderate_rain',
        severity: 'warning',
        message: `Moderate Rainfall: ${totalPrecip.toFixed(1)}mm expected`,
        description: `Moderate rainfall may affect water quality.`,
        impact: 'Moderate risk of water contamination.',
        recommendations: [
          'Monitor water quality closely',
          'Prepare water treatment supplies',
        ],
        precip: totalPrecip,
        dayIndex: index,
      })
    }

    // High humidity (85%+)
    if (avgHumidity >= 85) {
      alerts.push({
        date: day.date,
        dayName,
        type: 'high_humidity',
        severity: 'info',
        message: `High Humidity: ${avgHumidity}%`,
        description: `High humidity affects water evaporation and storage conditions.`,
        impact: 'May affect water storage and increase contamination risk.',
        recommendations: [
          'Monitor water storage containers',
          'Ensure proper sealing of water containers',
        ],
        humidity: avgHumidity,
        dayIndex: index,
      })
    }

    // Strong winds (50+ km/h) - can affect water infrastructure
    if (maxWind >= 50) {
      alerts.push({
        date: day.date,
        dayName,
        type: 'strong_wind',
        severity: 'warning',
        message: `Strong Winds: ${maxWind.toFixed(0)} km/h`,
        description: `Strong winds may affect water infrastructure and cause debris contamination.`,
        impact: 'Risk of infrastructure damage and water source contamination.',
        recommendations: [
          'Secure water infrastructure',
          'Monitor for debris in water sources',
        ],
        wind: maxWind,
        dayIndex: index,
      })
    }
  })

  return alerts.sort((a, b) => new Date(a.date) - new Date(b.date))
}

function TwoWeekForecast({ location = 'kampala' }) {
  const { forecastData, loading, error } = useTwoWeekForecast(location)
  const { weatherData } = useWeatherData(location)

  const extremeAlerts = useMemo(() => {
    if (!forecastData) return []
    return analyzeExtremeConditions(forecastData)
  }, [forecastData])

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!forecastData || !forecastData.forecast) return []

    return forecastData.forecast.forecastday.map((day) => {
      const date = new Date(day.date)
      const hasAlert = extremeAlerts.some((alert) => alert.date === day.date)

      return {
        date: day.date,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        maxTemp: Math.round(day.day.maxtemp_c),
        minTemp: Math.round(day.day.mintemp_c),
        avgTemp: Math.round(day.day.avgtemp_c),
        precip: day.day.totalprecip_mm,
        humidity: day.day.avghumidity,
        hasAlert,
        alertType: extremeAlerts.find((alert) => alert.date === day.date)?.type,
      }
    })
  }, [forecastData, extremeAlerts])

  const criticalAlerts = extremeAlerts.filter((a) => a.severity === 'critical')
  const warningAlerts = extremeAlerts.filter((a) => a.severity === 'warning')

  if (loading) {
    return (
      <motion.section
        className="chart-card wide"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="section-header">
          <h3>14-Day Temperature Forecast</h3>
          <p>Loading forecast data…</p>
        </div>
        <div className="status-text">Loading forecast...</div>
      </motion.section>
    )
  }

  if (error) {
    return (
      <motion.section
        className="chart-card wide"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="section-header">
          <h3>14-Day Temperature Forecast</h3>
        </div>
        <div className="status-text error">{error}</div>
      </motion.section>
    )
  }

  if (!forecastData) {
    return null
  }

  const locationName = UGANDA_LOCATIONS[location]?.name || 'Unknown'

  return (
    <motion.section
      className="chart-card wide"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="section-header">
        <div>
          <h3>14-Day Temperature Forecast — {locationName}</h3>
        </div>
        {extremeAlerts.length > 0 && (
          <div className="forecast-alert-summary">
            <div className="alert-summary-badge critical">
              {criticalAlerts.length} Critical
            </div>
            <div className="alert-summary-badge warning">
              {warningAlerts.length} Warnings
            </div>
          </div>
        )}
      </div>

      {/* Temperature Trend Chart */}
      <div className="forecast-chart-container">
        <h4>Temperature Trend (14 Days)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" minTickGap={2} />
            <YAxis label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'maxTemp') return [`${value}°C`, 'Max Temp']
                if (name === 'minTemp') return [`${value}°C`, 'Min Temp']
                if (name === 'avgTemp') return [`${value}°C`, 'Avg Temp']
                return [value, name]
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="maxTemp"
              name="Max Temp"
              stroke="#dc2626"
              fillOpacity={0.2}
              fill="url(#tempGradient)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="avgTemp"
              name="Avg Temp"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="minTemp"
              name="Min Temp"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Extreme Weather Alerts */}
      {extremeAlerts.length > 0 ? (
        <div className="extreme-weather-alerts">
          <h4>Extreme Weather Alerts & Disease Impact Warnings</h4>
          <div className="alerts-grid">
            {extremeAlerts.map((alert, idx) => (
              <motion.div
                key={`${alert.date}-${alert.type}`}
                className={`extreme-alert-card ${alert.severity}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="extreme-alert-header">
                  <div>
                    <span className="alert-date">{alert.dayName}</span>
                    <h5>{alert.message}</h5>
                  </div>
                  <span className={`severity-badge ${alert.severity}`}>
                    {alert.severity === 'critical' ? '🔴 Critical' : alert.severity === 'warning' ? '🟡 Warning' : '🔵 Info'}
                  </span>
                </div>
                <p className="extreme-alert-description">{alert.description}</p>
                <div className="extreme-alert-impact">
                  <strong>Disease Impact:</strong> {alert.impact}
                </div>
                <div className="extreme-alert-recommendations">
                  <strong>Recommended Actions:</strong>
                  <ul>
                    {alert.recommendations.map((rec, recIdx) => (
                      <li key={recIdx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="weather-status-ok">
          <span className="status-icon">✅</span>
          <div>
            <strong>No Extreme Weather Conditions Forecasted</strong>
            <p>
              The 14-day forecast for {locationName} shows no extreme weather conditions
              that would significantly impact cholera spread or water quality.
            </p>
          </div>
        </div>
      )}
    </motion.section>
  )
}

export default TwoWeekForecast

