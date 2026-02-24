import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useWeatherData, { UGANDA_LOCATIONS } from '../hooks/useWeatherData'

const LOCATION_KEYS = Object.keys(UGANDA_LOCATIONS)
const AUTO_ROTATE_INTERVAL = 20000 // 20 seconds

// Weather background gradients based on conditions
const getWeatherGradient = (temp, weatherText) => {
  const lowerText = weatherText.toLowerCase()
  if (lowerText.includes('rain') || lowerText.includes('storm')) {
    return 'linear-gradient(135deg, #4a5568 0%, #2d3748 50%, #1a202c 100%)'
  }
  if (lowerText.includes('cloud')) {
    return 'linear-gradient(135deg, #718096 0%, #4a5568 50%, #2d3748 100%)'
  }
  if (temp >= 30) {
    return 'linear-gradient(135deg, #f6ad55 0%, #ed8936 50%, #dd6b20 100%)'
  }
  if (temp <= 18) {
    return 'linear-gradient(135deg, #90cdf4 0%, #63b3ed 50%, #4299e1 100%)'
  }
  return 'linear-gradient(135deg, #48bb78 0%, #38a169 50%, #2f855a 100%)'
}

// Weather icon emoji based on conditions
const getWeatherEmoji = (weatherText, temp) => {
  const lowerText = weatherText.toLowerCase()
  if (lowerText.includes('rain') || lowerText.includes('storm')) return '🌧️'
  if (lowerText.includes('cloud')) return '☁️'
  if (lowerText.includes('sun') || temp >= 30) return '☀️'
  if (temp <= 18) return '❄️'
  return '🌤️'
}

function WeatherImpactAnalysis() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const autoRotateRef = useRef(null)
  const carouselTrackRef = useRef(null)
  const selectedLocation = LOCATION_KEYS[selectedIndex]
  const { weatherData, loading, error, alerts } = useWeatherData(selectedLocation)

  // Scroll to center the active card
  useEffect(() => {
    if (carouselTrackRef.current) {
      const track = carouselTrackRef.current
      const activeCard = track.children[selectedIndex]
      if (activeCard) {
        const cardWidth = activeCard.offsetWidth
        const cardLeft = activeCard.offsetLeft
        const trackWidth = track.clientWidth
        const scrollPosition = cardLeft - trackWidth / 2 + cardWidth / 2
        
        // Ensure we don't scroll beyond bounds
        const maxScroll = track.scrollWidth - trackWidth
        const clampedPosition = Math.max(0, Math.min(scrollPosition, maxScroll))
        
        track.scrollTo({
          left: clampedPosition,
          behavior: 'smooth',
        })
      }
    }
  }, [selectedIndex])

  // Auto-rotate through locations
  useEffect(() => {
    if (isPaused || loading) return

    autoRotateRef.current = setInterval(() => {
      setSelectedIndex((current) => (current + 1) % LOCATION_KEYS.length)
    }, AUTO_ROTATE_INTERVAL)

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [isPaused, loading])

  // Handle manual selection
  const handleLocationSelect = (index) => {
    setSelectedIndex(index)
    setIsPaused(true)
    // Resume auto-rotation after 10 seconds
    setTimeout(() => {
      setIsPaused(false)
    }, 10000)
  }

  // Analyze weather impact on response effectiveness
  const weatherImpact = useMemo(() => {
    if (!weatherData) return null

    const current = weatherData.current
    const temp = current.main?.temp ?? current.current?.temp_c ?? 0
    const humidity = current.main?.humidity ?? current.current?.humidity ?? 0
    const weatherText = (current.weather?.[0]?.description || current.current?.condition?.text || '').toLowerCase()

    const impacts = []

    // Temperature impact analysis
    if (temp >= 35) {
      impacts.push({
        type: 'temperature',
        severity: 'high',
        title: 'High Temperature Impact',
        description: `Current temperature of ${temp.toFixed(1)}°C increases water contamination risk.`,
        recommendations: [
          'Increase water quality monitoring frequency',
          'Ensure adequate water treatment supplies',
          'Monitor water storage conditions',
          'Consider enhanced surveillance in affected areas',
        ],
        riskLevel: 'Elevated',
      })
    } else if (temp <= 15) {
      impacts.push({
        type: 'temperature',
        severity: 'low',
        title: 'Low Temperature Impact',
        description: `Cooler temperatures (${temp.toFixed(1)}°C) may affect water infrastructure and access.`,
        recommendations: [
          'Check water infrastructure for cold-related issues',
          'Ensure water access points remain functional',
          'Monitor for infrastructure breakdowns',
          'Prepare backup water sources if needed',
        ],
        riskLevel: 'Moderate',
      })
    }

    // Humidity impact
    if (humidity >= 80) {
      impacts.push({
        type: 'humidity',
        severity: 'high',
        title: 'High Humidity Impact',
        description: `High humidity (${humidity}%) affects water evaporation and storage.`,
        recommendations: [
          'Monitor water storage containers for contamination',
          'Ensure proper water container sealing',
          'Check for mold growth in storage areas',
          'Increase water quality testing',
        ],
        riskLevel: 'Moderate',
      })
    }

    // Rain/Storm impact
    if (weatherText.includes('rain') || weatherText.includes('storm') || weatherText.includes('drizzle')) {
      impacts.push({
        type: 'precipitation',
        severity: 'high',
        title: 'Precipitation Impact',
        description: `Current weather conditions (${weatherText}) can cause flooding and water contamination.`,
        recommendations: [
          'Activate flood monitoring protocols',
          'Increase water quality testing in flood-prone areas',
          'Prepare emergency water treatment supplies',
          'Monitor water sources for contamination',
          'Alert communities about water safety',
        ],
        riskLevel: 'High',
      })
    }

    // Overall risk assessment
    const criticalAlerts = alerts.filter((a) => a.severity === 'critical')
    const warningAlerts = alerts.filter((a) => a.severity === 'warning')
    const overallRisk = criticalAlerts.length > 0 ? 'High' : warningAlerts.length > 2 ? 'Moderate' : 'Low'

    return {
      impacts,
      overallRisk,
      criticalAlertsCount: criticalAlerts.length,
      warningAlertsCount: warningAlerts.length,
      currentConditions: {
        temp,
        humidity,
        weather: weatherText,
      },
    }
  }, [weatherData, alerts])

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
          <h3>Weather Impact on Response Effectiveness</h3>
          <p>Analyzing weather conditions...</p>
        </div>
        <div className="status-text">Loading weather data...</div>
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
          <h3>Weather Impact on Response Effectiveness</h3>
        </div>
        <div className="status-text error">{error}</div>
      </motion.section>
    )
  }

  if (!weatherImpact) {
    return null
  }

  const riskColors = {
    High: '#dc2626',
    Moderate: '#f59e0b',
    Low: '#10b981',
  }

  const current = weatherData?.current
  const temp = current?.main?.temp ?? current?.current?.temp_c ?? 0
  const weatherText = (current?.weather?.[0]?.description || current?.current?.condition?.text || 'Clear').toLowerCase()

  return (
    <motion.section
      className="weather-section-carousel"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="carousel-header">
        <h3>Weather Impact on Response Effectiveness</h3>
        <p>
          Analysis of how current weather conditions affect cholera response
          strategies and water quality management across districts.
        </p>
      </div>

      <div className="weather-carousel-container">
        <button
          className="carousel-arrow carousel-arrow-left"
          onClick={() => handleLocationSelect((selectedIndex - 1 + LOCATION_KEYS.length) % LOCATION_KEYS.length)}
          aria-label="Previous district"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="weather-carousel-track" ref={carouselTrackRef}>
          {LOCATION_KEYS.map((locationKey, index) => {
            const location = UGANDA_LOCATIONS[locationKey]
            const isActive = index === selectedIndex
            
            const displayData = index === selectedIndex && weatherData ? weatherData : null
            const displayAlerts = index === selectedIndex ? alerts : []
            
            const locCurrent = displayData?.current
            const locTemp = locCurrent?.main?.temp ?? locCurrent?.current?.temp_c ?? 0
            const locWeatherText = (locCurrent?.weather?.[0]?.description || locCurrent?.current?.condition?.text || 'Clear').toLowerCase()

            return (
              <motion.div
                key={locationKey}
                className={`weather-card ${isActive ? 'active' : ''}`}
                onClick={() => handleLocationSelect(index)}
                initial={false}
                animate={{
                  scale: isActive ? 1.05 : 0.95,
                  zIndex: isActive ? 10 : 1,
                  opacity: isActive ? 1 : 0.7,
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  background: displayData
                    ? getWeatherGradient(locTemp, locWeatherText)
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                <div className="weather-card-content">
                  <div className="weather-card-header">
                    <div className="weather-emoji-large">
                      {displayData ? getWeatherEmoji(locWeatherText, locTemp) : '🌍'}
                    </div>
                    <div className="district-name">{location.name}</div>
                    <div className="district-region">{location.region}</div>
                  </div>

                  {displayData ? (
                    <>
                      <div className="weather-card-temp">
                        <div className="temp-main-large">{Math.round(locTemp)}°</div>
                        <div className="temp-feels-large">
                          {locWeatherText.charAt(0).toUpperCase() + locWeatherText.slice(1)}
                        </div>
                      </div>

                      <div className="weather-card-details">
                        <div className="weather-detail-item">
                          <span className="detail-icon">⚠️</span>
                          <span className="detail-value">
                            {displayAlerts.length} Alert{displayAlerts.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="weather-detail-item">
                          <span className="detail-icon">📊</span>
                          <span className="detail-value">
                            {weatherImpact?.overallRisk || 'Low'} Risk
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="weather-card-loading">Loading...</div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
        <button
          className="carousel-arrow carousel-arrow-right"
          onClick={() => handleLocationSelect((selectedIndex + 1) % LOCATION_KEYS.length)}
          aria-label="Next district"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {LOCATION_KEYS.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === selectedIndex ? 'active' : ''}`}
              onClick={() => handleLocationSelect(index)}
              aria-label={`Go to ${UGANDA_LOCATIONS[LOCATION_KEYS[index]].name}`}
            />
          ))}
        </div>
      </div>

      {/* Current Weather Impact Summary */}
      {weatherData && weatherImpact && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedLocation}
            className="weather-details-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <div className="details-panel-header">
              <div>
                <h4>{UGANDA_LOCATIONS[selectedLocation].name}</h4>
                <p className="details-subtitle">Current Weather Impact on Disease Response</p>
              </div>
              <span className="details-region">{UGANDA_LOCATIONS[selectedLocation].region} Region</span>
            </div>

            <div className="weather-impact-summary">
              <div className="risk-badge" style={{ borderColor: riskColors[weatherImpact.overallRisk] }}>
                <div className="risk-icon" style={{ color: riskColors[weatherImpact.overallRisk] }}>
                  {weatherImpact.overallRisk === 'High' ? '🔴' : weatherImpact.overallRisk === 'Moderate' ? '🟡' : '🟢'}
                </div>
                <span className="risk-label">Current Risk Level</span>
                <span
                  className="risk-value"
                  style={{ color: riskColors[weatherImpact.overallRisk] }}
                >
                  {weatherImpact.overallRisk}
                </span>
                <span className="risk-details">
                  {weatherImpact.criticalAlertsCount} critical,{' '}
                  {weatherImpact.warningAlertsCount} warnings
                </span>
              </div>

              <div className="current-conditions">
                <h4>Current Weather Conditions</h4>
                <div className="conditions-grid">
                  <div className="condition-card">
                    <div className="condition-icon">🌡️</div>
                    <span>Temperature</span>
                    <strong>{weatherImpact.currentConditions.temp.toFixed(1)}°C</strong>
                  </div>
                  <div className="condition-card">
                    <div className="condition-icon">💧</div>
                    <span>Humidity</span>
                    <strong>{weatherImpact.currentConditions.humidity}%</strong>
                  </div>
                  <div className="condition-card">
                    <div className="condition-icon">
                      {getWeatherEmoji(weatherImpact.currentConditions.weather, weatherImpact.currentConditions.temp)}
                    </div>
                    <span>Conditions</span>
                    <strong>{weatherImpact.currentConditions.weather || 'Clear'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {weatherImpact.impacts.length > 0 ? (
              <div className="weather-impacts-list">
                <h5 className="impacts-section-title">Current Weather Impact</h5>
                {weatherImpact.impacts.slice(0, 2).map((impact, idx) => (
                  <motion.div
                    key={`${impact.type}-${idx}`}
                    className="weather-impact-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    style={{
                      borderLeftColor: riskColors[impact.riskLevel] || '#2563eb',
                    }}
                  >
                    <div className="impact-header">
                      <div className="impact-title-section">
                        <span className="impact-type-icon">
                          {impact.type === 'temperature' ? '🌡️' : impact.type === 'humidity' ? '💧' : '🌧️'}
                        </span>
                        <h4>{impact.title}</h4>
                      </div>
                      <span
                        className="impact-risk-badge"
                        style={{ backgroundColor: riskColors[impact.riskLevel] }}
                      >
                        {impact.riskLevel} Risk
                      </span>
                    </div>
                    <p className="impact-description">{impact.description}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="weather-status-ok">
                <span className="status-icon">✅</span>
                <div>
                  <strong>Favorable current conditions</strong>
                  <p>
                    Current weather in {UGANDA_LOCATIONS[selectedLocation].name} is within normal range for response planning.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.section>
  )
}

export default WeatherImpactAnalysis
