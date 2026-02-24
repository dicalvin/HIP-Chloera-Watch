import { useState } from 'react'
import { motion } from 'framer-motion'
import SummaryCards from '../components/SummaryCards'
import CholeraMap from '../components/CholeraMap'
import MetricBreakdownModal from '../components/MetricBreakdownModal'

function Overview({
  loading,
  error,
  insights,
  summary,
  districtStats,
  geoData,
  geoError,
  dateRange,
  breakdowns,
  dataUpdatedAt,
}) {
  const [activeMetric, setActiveMetric] = useState(null)

  return (
    <div className="page">
      <motion.section
        className="hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Cholera Watch</p>
          <h1>Health Intelligence Platform</h1>
          <p className="lede">
            Blend surveillance, analytics, and geospatial insight to track suspected (sCh) vs confirmed (cCh)
            cholera cases, fatalities, and CFR trends across Uganda in real time.
          </p>
        </div>
        <div className="hero-pill">
          <p>Latest status</p>
          <strong>{summary.totalConfirmed.toLocaleString()} confirmed cases</strong>
        </div>
      </motion.section>

      {loading && <p className="status-text">Loading dataset…</p>}
      {error && <p className="status-text error">{error}</p>}

      {!loading && !error && (
        <>
          <SummaryCards summary={summary} onMetricSelect={setActiveMetric} />
          <CholeraMap
            geoData={geoData}
            districtStats={districtStats}
            geoError={geoError}
            dateRange={dateRange}
            dataUpdatedAt={dataUpdatedAt}
          />

          <motion.section
            className="insights"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h2>Key takeaways</h2>
            <ul>
              {insights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.section>
          {activeMetric && (
            <MetricBreakdownModal
              metric={activeMetric}
              summary={summary}
              breakdowns={breakdowns}
              onClose={() => setActiveMetric(null)}
            />
          )}
        </>
      )}
    </div>
  )
}

export default Overview


