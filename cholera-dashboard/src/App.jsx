import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Analytics from './pages/Analytics'
import ResponseInsights from './pages/ResponseInsights'
import EarlyWarning from './pages/EarlyWarning'
import ResourcePlanning from './pages/ResourcePlanning'
import Weather from './pages/Weather'
import DataAdmin from './pages/DataAdmin'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminLogin from './pages/AdminLogin'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import { AuthProvider, useAuth } from './context/AuthContext'
import useCholeraData from './hooks/useCholeraData'
import {
  aggregateSummary,
  buildCfrTrend,
  buildDistrictAggregates,
  buildInsights,
  buildRegionDistribution,
  buildSChVsCCh,
  buildConfirmedPositivitySeries,
  buildMonthlySuspectedSeries,
  buildSeasonalityProfile,
  buildMetricBreakdowns,
  buildResponseInsights,
  buildEarlyWarningInsights,
  buildResourcePlanningInsights,
  filterByDateRange,
  filterByRegionAndDistrict,
  getUniqueRegionsAndDistricts,
  formatForInput,
} from './utils/dataTransforms'

const ANALYTICS_START = new Date(2011, 0, 1)
const ANALYTICS_END = new Date(2024, 11, 31)

function InnerApp() {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()

  const { data, loading, error, minDate, maxDate, lastUpdatedAt } = useCholeraData()
  const [geoData, setGeoData] = useState(null)
  const [geoError, setGeoError] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedRegions, setSelectedRegions] = useState([])
  const [selectedDistricts, setSelectedDistricts] = useState([])

  const constrainedBounds = useMemo(() => {
    const minBound = minDate
      ? new Date(Math.max(minDate.valueOf(), ANALYTICS_START.valueOf()))
      : ANALYTICS_START
    const maxBound = maxDate
      ? new Date(Math.min(maxDate.valueOf(), ANALYTICS_END.valueOf()))
      : ANALYTICS_END
    return { minBound, maxBound }
  }, [minDate, maxDate])

  const defaultRange = useMemo(
    () => ({
      start: formatForInput(constrainedBounds.minBound),
      end: formatForInput(constrainedBounds.maxBound),
    }),
    [constrainedBounds],
  )

  const effectiveDateRange = useMemo(() => {
    const parsedStart = dateRange.start ? new Date(dateRange.start) : null
    const parsedEnd = dateRange.end ? new Date(dateRange.end) : null
    const start = parsedStart && !Number.isNaN(parsedStart.valueOf())
      ? parsedStart
      : new Date(defaultRange.start)
    const end = parsedEnd && !Number.isNaN(parsedEnd.valueOf())
      ? parsedEnd
      : new Date(defaultRange.end)
    const clampedStart = new Date(
      Math.max(start.valueOf(), constrainedBounds.minBound.valueOf()),
    )
    const clampedEnd = new Date(
      Math.min(end.valueOf(), constrainedBounds.maxBound.valueOf()),
    )
    return {
      start: formatForInput(clampedStart),
      end: formatForInput(clampedEnd),
    }
  }, [dateRange, defaultRange, constrainedBounds])

  useEffect(() => {
    fetch('/ug.json')
      .then((res) => res.json())
      .then(setGeoData)
      .catch(() => setGeoError('Unable to load map boundaries.'))
  }, [])

  const { regions: regionOptions, districts: districtOptions } = useMemo(
    () => getUniqueRegionsAndDistricts(data || []),
    [data],
  )

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []
    const byDate = filterByDateRange(data, effectiveDateRange)
    const byLocation = filterByRegionAndDistrict(byDate, {
      regions: selectedRegions,
      districts: selectedDistricts,
    })
    return byLocation
  }, [data, effectiveDateRange, selectedRegions, selectedDistricts])

  const memoizedData = useMemo(() => {
    const summary = aggregateSummary(filteredData)
    const regionDistribution = buildRegionDistribution(filteredData)
    const scatterData = buildSChVsCCh(filteredData)
    const cfrTrend = buildCfrTrend(filteredData)
    const confirmedPositivity = buildConfirmedPositivitySeries(filteredData)
    const monthlySuspected = buildMonthlySuspectedSeries(filteredData)
    const seasonality = buildSeasonalityProfile(filteredData)
    const insights = buildInsights(
      filteredData,
      regionDistribution,
      cfrTrend,
      summary,
    )
    const districtStats = buildDistrictAggregates(filteredData)
    const breakdowns = buildMetricBreakdowns(filteredData)
    const responseInsights = buildResponseInsights(filteredData, breakdowns)
    const earlyWarning = buildEarlyWarningInsights(filteredData)
    const resourcePlanning = buildResourcePlanningInsights(
      filteredData,
      districtStats,
      breakdowns,
    )

    return {
      summary,
      regionDistribution,
      scatterData,
      cfrTrend,
      insights,
      districtStats,
      confirmedPositivity,
      monthlySuspected,
      seasonality,
      breakdowns,
      responseInsights,
      earlyWarning,
      resourcePlanning,
    }
  }, [filteredData])

  const dateBounds = useMemo(
    () => ({
      min: formatForInput(constrainedBounds.minBound),
      max: formatForInput(constrainedBounds.maxBound),
    }),
    [constrainedBounds],
  )

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/admin-login' ||
    location.pathname === '/terms' ||
    location.pathname === '/privacy'

  if (isAuthPage) {
    // Public pages: no Layout, no auth required
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (authLoading) {
    return (
      <div className="page">
        <p className="status-text">Checking access…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Protected application: wrapped in Layout, all routes require login
  return (
    <Layout
      loading={loading}
      summary={memoizedData.summary}
      lastUpdatedAt={lastUpdatedAt}
    >
      <Routes>
        <Route
          path="/"
          element={(
            <Overview
              loading={loading}
              error={error}
              insights={memoizedData.insights}
              summary={memoizedData.summary}
              districtStats={memoizedData.districtStats}
              geoData={geoData}
              geoError={geoError}
              dateRange={effectiveDateRange}
              breakdowns={memoizedData.breakdowns}
              dataUpdatedAt={lastUpdatedAt}
            />
          )}
        />
        <Route
          path="/analytics"
          element={(
            <Analytics
              loading={loading}
              error={error}
              dateRange={effectiveDateRange}
              onDateChange={setDateRange}
              dateBounds={dateBounds}
              regionOptions={regionOptions}
              districtOptions={districtOptions}
              selectedRegions={selectedRegions}
              selectedDistricts={selectedDistricts}
              onRegionChange={setSelectedRegions}
              onDistrictChange={setSelectedDistricts}
              summary={memoizedData.summary}
              scatterData={memoizedData.scatterData}
              regionDistribution={memoizedData.regionDistribution}
              cfrTrend={memoizedData.cfrTrend}
              confirmedPositivity={memoizedData.confirmedPositivity}
              monthlySuspected={memoizedData.monthlySuspected}
              seasonality={memoizedData.seasonality}
            />
          )}
        />
        <Route
          path="/response-insights"
          element={(
            <ResponseInsights
              loading={loading}
              error={error}
              spreadInsights={memoizedData.responseInsights}
              filteredData={filteredData}
              summary={memoizedData.summary}
            />
          )}
        />
        <Route
          path="/early-warning"
          element={(
            <EarlyWarning
              loading={loading}
              error={error}
              earlyWarning={memoizedData.earlyWarning}
              filteredData={filteredData}
              summary={memoizedData.summary}
            />
          )}
        />
        <Route
          path="/resource-planning"
          element={(
            <ResourcePlanning
              loading={loading}
              error={error}
              resourcePlanning={memoizedData.resourcePlanning}
              filteredData={filteredData}
              summary={memoizedData.summary}
            />
          )}
        />
        <Route path="/weather" element={<Weather />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/data-admin" element={<DataAdmin />} />
        <Route path="/admin" element={<DataAdmin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
