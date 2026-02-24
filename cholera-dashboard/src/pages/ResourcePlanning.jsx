import { motion } from 'framer-motion'

function ResourcePlanning({ loading, error, resourcePlanning, filteredData, summary }) {
  if (loading) {
    return <p className="status-text">Loading dataset…</p>
  }

  if (error) {
    return <p className="status-text error">{error}</p>
  }

  const {
    priorityAreas = [],
    impactAssessment = {},
    resourceSignals = [],
  } = resourcePlanning || {}

  return (
    <div className="page">
      <motion.section
        className="hero secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Resource planning</p>
          <h1>Priority areas & impact assessment</h1>
          <p className="lede">
            Identify the districts exerting the highest pressure on the health
            system and quantify their impact for efficient allocation planning.
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
          <h3>Priority area identification</h3>
          <p>Top districts sorted by severity (confirmed + deaths weighting).</p>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>District</th>
                <th>Confirmed</th>
                <th>Suspected</th>
                <th>Deaths</th>
                <th>Share of confirmed</th>
              </tr>
            </thead>
            <tbody>
              {priorityAreas.map((area) => (
                <tr key={area.label}>
                  <td>{area.label}</td>
                  <td>{area.confirmed.toLocaleString()}</td>
                  <td>{area.suspected.toLocaleString()}</td>
                  <td>{area.deaths.toLocaleString()}</td>
                  <td>{area.share.toFixed(1)}%</td>
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
            <h3>Impact assessment</h3>
            <p>Totals over the filtered window (2011–2024).</p>
          </div>
          <div className="insight-cards">
            <div className="insight-card">
              <p>Suspected</p>
              <strong>{impactAssessment.totalSuspected?.toLocaleString() ?? 0}</strong>
            </div>
            <div className="insight-card">
              <p>Confirmed</p>
              <strong>{impactAssessment.totalConfirmed?.toLocaleString() ?? 0}</strong>
            </div>
            <div className="insight-card">
              <p>Deaths</p>
              <strong>{impactAssessment.totalDeaths?.toLocaleString() ?? 0}</strong>
            </div>
            <div className="insight-card">
              <p>CFR</p>
              <strong>{impactAssessment.cfr?.toFixed(2) ?? 0}%</strong>
            </div>
          </div>
        </motion.article>

        <motion.article
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-header">
            <h3>Resource pressure signals</h3>
            <p>Regions ranked by combined pressure score.</p>
          </div>
          <ul className="list-grid">
            {resourceSignals.map((signal) => (
              <li key={signal.label}>
                <strong>{signal.label}</strong>
                <p>
                  Pressure score {signal.pressureScore.toLocaleString()} • Positivity{' '}
                  {signal.positivity.toFixed(1)}% • Avg CFR {signal.avgCFR.toFixed(2)}%
                </p>
              </li>
            ))}
          </ul>
        </motion.article>
      </section>
    </div>
  )
}

export default ResourcePlanning

