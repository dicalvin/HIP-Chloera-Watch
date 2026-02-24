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
import { motion } from 'framer-motion'
import WeatherThreatsList from '../components/WeatherThreatsList'
import LSTMForecast from '../components/LSTMForecast'

function EarlyWarning({ loading, error, earlyWarning, filteredData, summary }) {
  const { alertSeries = [], anomalies = [], forecast = [] } = earlyWarning || {}

  if (loading) {
    return <p className="status-text">Loading dataset…</p>
  }

  if (error) {
    return <p className="status-text error">{error}</p>
  }

  return (
    <div className="page">
      <motion.section
        className="hero secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Early warning & forecasting</p>
          <h1>Alert thresholds & anomaly detection</h1>
          <p className="lede">
            Monitor alert conditions, rolling averages, and AI-powered
            short-term forecasts that combine surveillance trends with weather
            signals.
          </p>
        </div>
      </motion.section>

      <motion.section
        className="chart-card wide"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="section-header">
          <h3>Alert threshold monitoring</h3>
          <p>Confirmed cases vs rolling average with alert flags.</p>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={alertSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" minTickGap={24} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="confirmed"
              name="Confirmed cases"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="rollingAverage"
              name="Rolling average"
              stroke="#1d4ed8"
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.section>

      <WeatherThreatsList />

      <section className="grid chart-grid">
        <motion.article
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <h3>Recent alert anomalies</h3>
            <p>Most recent spikes beyond 25% above rolling average.</p>
          </div>
          <ul className="list-grid">
            {anomalies.length ? (
              anomalies.map((alert) => (
                <li key={alert.label}>
                  <strong>{alert.label}</strong>
                  <p>
                    {alert.confirmed.toLocaleString()} cCh • deviation{' '}
                    {alert.deviation.toFixed(1)}%
                  </p>
                </li>
              ))
            ) : (
              <li>No anomalies detected in this window.</li>
            )}
          </ul>
        </motion.article>

      </section>

      {filteredData && filteredData.length > 0 && (
        <LSTMForecast
          historicalData={filteredData}
          region={summary?.topRegion || 'Central'}
        />
      )}
    </div>
  )
}

export default EarlyWarning
