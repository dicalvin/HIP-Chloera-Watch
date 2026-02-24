import { motion } from 'framer-motion'
import FilterPanel from '../components/FilterPanel'
import SummaryCards from '../components/SummaryCards'
import SuspectedVsConfirmedChart from '../components/charts/SuspectedVsConfirmedChart'
import RegionDistributionChart from '../components/charts/RegionDistributionChart'
import CfrTrendChart from '../components/charts/CfrTrendChart'
import ConfirmedPositivityTrend from '../components/charts/ConfirmedPositivityTrend'
import MonthlySuspectedChart from '../components/charts/MonthlySuspectedChart'
import SeasonalityChart from '../components/charts/SeasonalityChart'

function Analytics({
  loading,
  error,
  dateRange,
  onDateChange,
  dateBounds,
  regionOptions,
  districtOptions,
  selectedRegions,
  selectedDistricts,
  onRegionChange,
  onDistrictChange,
  summary,
  scatterData,
  regionDistribution,
  cfrTrend,
  confirmedPositivity,
  monthlySuspected,
  seasonality,
}) {
  return (
    <div className="page">
      <motion.section
        className="hero secondary"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div>
          <p className="eyebrow">Deep dive</p>
          <h1>Interactive analytics & filters</h1>
          <p className="lede">
            Compare interventions and outbreaks by focusing on any custom date
            range. Charts and the map update automatically to reflect your
            selections.
          </p>
        </div>
      </motion.section>

      <FilterPanel
        dateRange={dateRange}
        onDateChange={onDateChange}
        dateBounds={dateBounds}
        regionOptions={regionOptions}
        districtOptions={districtOptions}
        selectedRegions={selectedRegions}
        selectedDistricts={selectedDistricts}
        onRegionChange={onRegionChange}
        onDistrictChange={onDistrictChange}
      />

      {loading && <p className="status-text">Loading dataset…</p>}
      {error && <p className="status-text error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="analytics-section analytics-section--summary">
            <h2 className="analytics-section__title">Summary</h2>
            <SummaryCards summary={summary} />
          </section>

          <section className="analytics-section analytics-section--trends">
            <h2 className="analytics-section__title">Trends over time</h2>
            <p className="analytics-section__desc">Case positivity, monthly suspected cases, seasonality, and CFR.</p>
            <div className="analytics-charts analytics-charts--2col">
              <ConfirmedPositivityTrend series={confirmedPositivity} />
              <MonthlySuspectedChart data={monthlySuspected} />
              <SeasonalityChart data={seasonality} />
              <CfrTrendChart series={cfrTrend} />
            </div>
          </section>

          <section className="analytics-section analytics-section--distribution">
            <h2 className="analytics-section__title">Distribution & comparison</h2>
            <p className="analytics-section__desc">Regional burden and suspected vs confirmed cases.</p>
            <div className="analytics-charts analytics-charts--2col">
              <RegionDistributionChart data={regionDistribution} />
              <SuspectedVsConfirmedChart data={scatterData} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Analytics


