import { motion } from 'framer-motion'
import WeatherThreatsList from '../components/WeatherThreatsList'
import RecentWeatherAnomalies from '../components/RecentWeatherAnomalies'

function Weather() {
  return (
    <div className="page page--weather">
      <motion.section
        className="hero hero--secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Weather monitoring</p>
          <h1>Real-time weather & risk</h1>
          <p className="lede">
            Track key weather threats and recent anomalies that could affect cholera risk.
          </p>
        </div>
      </motion.section>

      <section className="weather-page-sections weather-page-sections--simplified">
        <div className="weather-section weather-section--threats">
          <WeatherThreatsList />
        </div>

        <div className="weather-section weather-section--anomalies">
          <RecentWeatherAnomalies />
        </div>
      </section>
    </div>
  )
}

export default Weather
