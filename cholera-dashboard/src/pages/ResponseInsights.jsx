import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'
function ResponseInsights({ loading, error, spreadInsights, filteredData, summary }) {
  if (loading) {
    return <p className="status-text">Loading dataset…</p>
  }

  if (error) {
    return <p className="status-text error">{error}</p>
  }

  const {
    spreadSeries = [],
    outbreakThreshold = 0,
    outbreakFlags = [],
    responseIndicators = {},
    riskRegions = [],
    vulnerablePopulations = [],
  } = spreadInsights || {}

  return (
    <div className="page">
      <motion.section
        className="hero secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Spread intelligence</p>
          <h1>Spread patterns & response effectiveness</h1>
          <p className="lede">
            Diagnose how suspected (sCh) and confirmed (cCh) cases evolve, where
            thresholds are surpassed, and which regions require priority support.
          </p>
        </div>
      </motion.section>

      <section className="grid chart-grid">
        <motion.article
          className="chart-card wide"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <div>
              <h3>Spread pattern analysis</h3>
              <p>
                Monthly suspected vs confirmed totals with growth rate overlays.
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={spreadSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" minTickGap={24} />
              <YAxis yAxisId="left" />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="suspected"
                name="Suspected"
                fill="#fde68a"
                stroke="#f59e0b"
                fillOpacity={0.3}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="confirmed"
                name="Confirmed"
                fill="#fecaca"
                stroke="#dc2626"
                fillOpacity={0.4}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="growthRate"
                name="Growth rate"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.article>

        <motion.article
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <div>
              <h3>Outbreak threshold monitoring (AI‑assisted)</h3>
              <p>
                Monthly exceedances of the adaptive confirmed‑case threshold
                ({outbreakThreshold.toLocaleString()} cCh) with upcoming risk
                inferred from the AI forecast.
              </p>
            </div>
          </div>
          <ul className="list-grid">
            {outbreakFlags.length ? (
              outbreakFlags.map((flag) => (
                <li key={flag.label}>
                  <strong>{flag.label}</strong>
                  <p>
                    {flag.confirmed.toLocaleString()} cCh • Growth{' '}
                    {flag.growthRate.toFixed(1)}%
                  </p>
                </li>
              ))
            ) : (
              <li>No periods exceeded the threshold in this window.</li>
            )}
          </ul>
        </motion.article>

        <motion.article
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <h3>Response effectiveness indicators (recent 6 months)</h3>
          </div>
          <div className="insight-cards">
            <div className="insight-card">
              <p>Avg positivity</p>
              <strong>{responseIndicators.avgPositivity?.toFixed(1) ?? 0}%</strong>
            </div>
            <div className="insight-card">
              <p>Avg CFR</p>
              <strong>{responseIndicators.avgCFR?.toFixed(2) ?? 0}%</strong>
            </div>
            <div className="insight-card">
              <p>Avg growth</p>
              <strong>{responseIndicators.avgGrowth?.toFixed(1) ?? 0}%</strong>
            </div>
          </div>
        </motion.article>
      </section>


      <motion.section
        className="chart-card wide"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="section-header">
          <h3>Risk factor analysis</h3>
          <p>Regions ranked by composite risk score (CFR + positivity + case pressure).</p>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Region</th>
                <th>Confirmed</th>
                <th>Avg CFR</th>
                <th>Positivity</th>
                <th>Risk score</th>
              </tr>
            </thead>
            <tbody>
              {riskRegions.map((region) => (
                <tr key={region.label}>
                  <td>{region.label}</td>
                  <td>{region.confirmed.toLocaleString()}</td>
                  <td>{region.avgCFR.toFixed(2)}%</td>
                  <td>{region.positivity.toFixed(1)}%</td>
                  <td>{region.riskScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      <section className="grid chart-grid">
        <motion.article
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <h3>Vulnerable population analysis</h3>
            <p>Districts with the highest death burden.</p>
          </div>
          <ul className="list-grid">
            {vulnerablePopulations.map((district) => (
              <li key={district.label}>
                <strong>{district.label}</strong>
                <p>
                  {district.deaths.toLocaleString()} deaths •{' '}
                  {district.confirmed.toLocaleString()} cCh
                </p>
              </li>
            ))}
          </ul>
        </motion.article>

      </section>
    </div>
  )
}

export default ResponseInsights


