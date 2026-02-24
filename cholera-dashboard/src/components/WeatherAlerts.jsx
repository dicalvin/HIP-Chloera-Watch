import { useState, useEffect, useRef } from 'react'
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

function WeatherAlerts({ onLocationChange }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const autoRotateRef = useRef(null)
  const carouselTrackRef = useRef(null)
  const selectedLocation = LOCATION_KEYS[selectedIndex]
  const { weatherData, loading, error, alerts } = useWeatherData(selectedLocation)

  // Notify parent of location change
  useEffect(() => {
    if (onLocationChange) {
      onLocationChange(selectedLocation)
    }
  }, [selectedLocation, onLocationChange])

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

  if (loading) {
    return (
      <motion.section
        className="weather-section-carousel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="weather-loading">Loading weather data...</div>
      </motion.section>
    )
  }

  if (error) {
    return (
      <motion.section
        className="weather-section-carousel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="weather-error">
          <p>⚠️ Weather data unavailable</p>
          <small>{error}</small>
        </div>
      </motion.section>
    )
  }

  const severityColors = {
    critical: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6',
  }

  const severityLabels = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Information',
  }

  return (
    <motion.section
      className="weather-section-carousel"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="carousel-header">
        <h3>Climate & Weather Risk Monitor</h3>
        <p>District-level conditions and alerts that can amplify cholera risk</p>
      </div>

      <div className="weather-carousel-wrapper">
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
            
            // Use current location's weather data if available, otherwise show placeholder
            const displayData = index === selectedIndex && weatherData ? weatherData : null
            const displayAlerts = index === selectedIndex ? alerts : []
            
            const current = displayData?.current
            const temp = current?.main?.temp ?? current?.current?.temp_c ?? 0
            const feelsLike = current?.main?.feels_like ?? current?.current?.feelslike_c ?? temp
            const humidity = current?.main?.humidity ?? current?.current?.humidity ?? 0
            const weatherText = (current?.weather?.[0]?.description || current?.current?.condition?.text || 'Clear').toLowerCase()
            const weatherIcon = current?.weather?.[0]?.icon || current?.current?.condition?.icon || ''

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
                    ? getWeatherGradient(temp, weatherText)
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                <div className="weather-card-content">
                  <div className="weather-card-header">
                    <div className="weather-emoji-large">
                      {displayData ? getWeatherEmoji(weatherText, temp) : '🌍'}
                    </div>
                    <div className="district-name">{location.name}</div>
                    <div className="district-region">{location.region}</div>
                  </div>

                  {displayData ? (
                    <>
                      <div className="weather-card-temp">
                        <div className="temp-main-large">{Math.round(temp)}°</div>
                        <div className="temp-feels-large">
                          Feels like {Math.round(feelsLike)}°
                        </div>
                      </div>

                      <div className="weather-card-details">
                        <div className="weather-detail-item">
                          <span className="detail-icon">💧</span>
                          <span className="detail-value">{humidity}%</span>
                        </div>
                        <div className="weather-detail-item">
                          <span className="detail-icon">🌬️</span>
                          <span className="detail-value">
                            {current?.wind?.speed?.toFixed(1) || 0} m/s
                          </span>
                        </div>
                      </div>

                      {displayAlerts.length > 0 && (
                        <div className="weather-card-alerts">
                          <div className="alerts-badge">
                            {displayAlerts.length} Alert{displayAlerts.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      )}
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
        </div>

        {/* Carousel Indicators - Moved Below */}
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

        {/* Active Card Details - Moved to Right */}
        {weatherData && (
          <div className="weather-details-sidebar">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedLocation}
                className="weather-details-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
              >
            <div className="details-panel-header">
              <div>
                <h4>{UGANDA_LOCATIONS[selectedLocation].name}</h4>
                <p className="details-subtitle">Weather Details & Alerts</p>
              </div>
              <span className="details-region">{UGANDA_LOCATIONS[selectedLocation].region} Region</span>
            </div>

            {alerts.length > 0 ? (
              <div className="weather-alerts-list">
                {alerts.map((alert, idx) => (
                  <motion.div
                    key={`${alert.type}-${idx}`}
                    className="weather-alert-card"
                    style={{
                      borderLeftColor: severityColors[alert.severity] || '#64748b',
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="alert-header">
                      <span className="alert-icon-large">{alert.icon}</span>
                      <span
                        className="alert-severity"
                        style={{ color: severityColors[alert.severity] }}
                      >
                        {severityLabels[alert.severity]}
                      </span>
                    </div>
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-description">{alert.description}</div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="weather-status-ok">
                <span className="status-icon">✅</span>
                <p>No weather alerts at this time. Conditions are normal for {UGANDA_LOCATIONS[selectedLocation].name}.</p>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.section>
  )
}

export default WeatherAlerts
