import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import useWeatherData, { UGANDA_LOCATIONS } from '../hooks/useWeatherData'

// Individual location hook wrapper
function useLocationWeather(location) {
  return useWeatherData(location)
}

function MultiLocationForecast() {
  const [selectedLocations, setSelectedLocations] = useState(['kampala', 'gulu', 'mbale'])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch weather for each selected location using individual hooks
  const kampalaData = useLocationWeather('kampala')
  const guluData = useLocationWeather('gulu')
  const mbaleData = useLocationWeather('mbale')
  const mbararaData = useLocationWeather('mbarara')
  const jinjaData = useLocationWeather('jinja')

  const locationDataMap = {
    kampala: { key: 'kampala', name: UGANDA_LOCATIONS.kampala.name, ...kampalaData },
    gulu: { key: 'gulu', name: UGANDA_LOCATIONS.gulu.name, ...guluData },
    mbale: { key: 'mbale', name: UGANDA_LOCATIONS.mbale.name, ...mbaleData },
    mbarara: { key: 'mbarara', name: UGANDA_LOCATIONS.mbarara.name, ...mbararaData },
    jinja: { key: 'jinja', name: UGANDA_LOCATIONS.jinja.name, ...jinjaData },
  }

  const locationData = selectedLocations.map((loc) => locationDataMap[loc]).filter(Boolean)

  const allLoaded = locationData.every((loc) => !loc.loading && loc.weatherData)
  const hasError = locationData.some((loc) => loc.error)

  // Combine forecast data from all locations
  const combinedForecast = useMemo(() => {
    if (!allLoaded) return []

    // Get the first location's time points (next 24 hours, hourly)
    const firstLocation = locationData[0]
    if (!firstLocation.weatherData?.forecast?.list) return []

    const timePoints = firstLocation.weatherData.forecast.list
      .slice(0, 24) // Next 24 hours
      .map((item) => {
        const date = new Date((item.dt || item.time_epoch) * 1000)
        return {
          timestamp: date,
          time: date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          dateLabel: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          fullLabel: date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            hour12: true,
          }),
        }
      })

    // Map each location's data to the time points
    return timePoints.map((timePoint, idx) => {
      const dataPoint = {
        ...timePoint,
        period: idx < 8 ? 'Today' : idx < 16 ? 'Tomorrow' : 'Day After',
      }

      locationData.forEach((loc) => {
        if (loc.weatherData?.forecast?.list?.[idx]) {
          const item = loc.weatherData.forecast.list[idx]
          const temp = item.main?.temp ?? item.main?.temp_c ?? 0
          dataPoint[loc.name] = Math.round(temp)
        }
      })

      return dataPoint
    })
  }, [locationData, allLoaded])

  // Generate warnings for each location
  const locationWarnings = useMemo(() => {
    return locationData
      .filter((loc) => loc.weatherData && loc.alerts && loc.alerts.length > 0)
      .map((loc) => {
        const criticalAlerts = loc.alerts.filter((a) => a.severity === 'critical')
        const warningAlerts = loc.alerts.filter((a) => a.severity === 'warning')
        const currentTemp = loc.weatherData.current.main?.temp ?? loc.weatherData.current.main?.temp_c ?? 0

        return {
          location: loc.name,
          criticalCount: criticalAlerts.length,
          warningCount: warningAlerts.length,
          alerts: [...criticalAlerts, ...warningAlerts].slice(0, 3), // Top 3 alerts
          currentTemp,
        }
      })
  }, [locationData])

  if (hasError && !allLoaded) {
    return (
      <motion.section
        className="chart-card wide"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="section-header">
          <h3>Multi-Location Weather Forecast</h3>
          <p>Some locations failed to load. Please try again later.</p>
        </div>
      </motion.section>
    )
  }

  if (!allLoaded) {
    return (
      <motion.section
        className="chart-card wide"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="section-header">
          <h3>Multi-Location Weather Forecast</h3>
          <p>Loading weather data for multiple locations...</p>
        </div>
      </motion.section>
    )
  }

  const forecastStart = combinedForecast[0]?.timestamp
  const forecastEnd = combinedForecast[combinedForecast.length - 1]?.timestamp
  const forecastPeriod = forecastStart && forecastEnd
    ? `${forecastStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' })} - ${forecastEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' })}`
    : 'Next 24 hours'

  // Color palette for different locations
  const locationColors = {
    Kampala: '#3b82f6',
    Gulu: '#10b981',
    Mbale: '#f59e0b',
    Mbarara: '#ef4444',
    Jinja: '#8b5cf6',
  }

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
          <h3>Multi-Location Temperature Forecast</h3>
          <p>
            <strong>Forecast Period:</strong> {forecastPeriod}
          </p>
          <p>Compare temperature trends across Ugandan districts to anticipate climate-sensitive cholera risk.</p>
        </div>
        <div className="location-selector">
          <button
            type="button"
            className="location-selector-toggle"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {selectedLocations.length === 0
              ? 'Select districts'
              : `${selectedLocations.length} district${selectedLocations.length > 1 ? 's' : ''} selected`}
          </button>
          {isDropdownOpen && (
            <div className="location-selector-dropdown">
              <input
                type="text"
                className="location-search-input"
                placeholder="Search district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="location-options">
                {Object.entries(UGANDA_LOCATIONS)
                  .filter(([_, loc]) =>
                    loc.name.toLowerCase().includes(searchTerm.toLowerCase()),
                  )
                  .map(([key, loc]) => {
                    const checked = selectedLocations.includes(key)
                    return (
                      <label key={key} className="location-option">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLocations([...selectedLocations, key])
                            } else {
                              // Prevent clearing the last selected location
                              if (selectedLocations.length === 1 && checked) {
                                return
                              }
                              setSelectedLocations(
                                selectedLocations.filter((id) => id !== key),
                              )
                            }
                          }}
                        />
                        <span>{loc.name}</span>
                      </label>
                    )
                  })}
              </div>
              <p className="location-help-text">
                At least one district must remain selected so the forecast always has context.
              </p>
            </div>
          )}
        </div>
      </div>

      {locationWarnings.length > 0 && (
        <div className="forecast-warnings">
          <h4>Active Weather Warnings</h4>
          <div className="warnings-grid">
            {locationWarnings.map((warning) => (
              <div key={warning.location} className="location-warning">
                <div className="warning-header">
                  <strong>{warning.location}</strong>
                  <span className="warning-badge">
                    {warning.criticalCount > 0 && (
                      <span className="critical">⚠️ {warning.criticalCount} Critical</span>
                    )}
                    {warning.warningCount > 0 && (
                      <span className="warning">⚠️ {warning.warningCount} Warnings</span>
                    )}
                  </span>
                </div>
                <div className="warning-temp">Current: {warning.currentTemp.toFixed(1)}°C</div>
                <ul className="warning-list">
                  {warning.alerts.map((alert, idx) => (
                    <li key={idx}>
                      <span className="alert-icon">{alert.icon}</span>
                      <span>{alert.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={combinedForecast} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fullLabel"
            angle={-45}
            textAnchor="end"
            height={100}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value, name) => [`${value}°C`, name]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend />
          {selectedLocations.map((locKey) => {
            const locName = UGANDA_LOCATIONS[locKey].name
            return (
              <Line
                key={locName}
                type="monotone"
                dataKey={locName}
                name={locName}
                stroke={locationColors[locName] || '#64748b'}
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>

      <div className="forecast-summary-multi">
        {selectedLocations.map((locKey) => {
          const loc = locationData.find((l) => l.key === locKey)
          if (!loc?.weatherData) return null

          const temps = combinedForecast
            .map((d) => d[loc.name])
            .filter((t) => t !== undefined)
          const currentTemp = loc.weatherData.current.main?.temp ?? loc.weatherData.current.main?.temp_c ?? 0

          return (
            <div key={locKey} className="forecast-stat-multi">
              <div className="stat-header">
                <strong>{loc.name}</strong>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: locationColors[loc.name] || '#64748b',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                />
              </div>
              <div className="stat-values">
                <span>Current: {currentTemp.toFixed(1)}°C</span>
                <span>High: {Math.max(...temps, currentTemp)}°C</span>
                <span>Low: {Math.min(...temps, currentTemp)}°C</span>
              </div>
            </div>
          )
        })}
      </div>
    </motion.section>
  )
}

export default MultiLocationForecast

