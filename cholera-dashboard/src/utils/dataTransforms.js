const formatForInput = (date) =>
  date ? date.toISOString().split('T')[0] : ''

const filterByDateRange = (rows, { start, end }) => {
  if (!rows.length) return []
  const startDate = start ? new Date(start) : null
  const endDate = end ? new Date(end) : null

  return rows.filter((row) => {
    if (!row.reportingDate) return false
    if (startDate && row.reportingDate < startDate) return false
    if (endDate && row.reportingDate > endDate) return false
    return true
  })
}

/** Normalize region/district for comparison (trim, treat empty as 'Unknown' where needed) */
const norm = (v) => (v && String(v).trim()) || ''

/**
 * Filter rows by selected regions and/or districts.
 * Empty arrays mean "no filter" (all). Case-insensitive match.
 */
const filterByRegionAndDistrict = (rows, { regions = [], districts = [] }) => {
  if (!rows.length) return []
  if (regions.length === 0 && districts.length === 0) return rows

  const regionSet = new Set(regions.map((r) => norm(r).toLowerCase()))
  const districtSet = new Set(districts.map((d) => norm(d).toLowerCase()))

  return rows.filter((row) => {
    const rowRegion = norm(row.region).toLowerCase()
    const rowDistrict = norm(row.district || row.location).toLowerCase()

    if (regionSet.size && !regionSet.has(rowRegion)) return false
    if (districtSet.size && !districtSet.has(rowDistrict)) return false
    return true
  })
}

/**
 * Get unique regions and districts from data for filter dropdowns.
 * Returns { regions: string[], districts: string[] } sorted, no empty strings.
 */
const getUniqueRegionsAndDistricts = (rows) => {
  if (!rows || !rows.length) return { regions: [], districts: [] }
  const regionSet = new Set()
  const districtSet = new Set()
  rows.forEach((row) => {
    const r = norm(row.region)
    if (r && r !== 'Unknown') regionSet.add(row.region.trim())
    const d = norm(row.district || row.location)
    if (d) districtSet.add((row.district || row.location).trim())
  })
  return {
    regions: Array.from(regionSet).sort((a, b) => a.localeCompare(b)),
    districts: Array.from(districtSet).sort((a, b) => a.localeCompare(b)),
  }
}

const aggregateSummary = (rows) => {
  if (!rows.length) {
    return {
      totalReports: 0,
      totalSuspected: 0,
      totalConfirmed: 0,
      totalDeaths: 0,
      avgCFR: 0,
      positivityRate: 0,
    }
  }

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalReports += 1
      acc.totalSuspected += row.sCh
      acc.totalConfirmed += row.cCh
      acc.totalDeaths += row.deaths
      acc.cfrTotal += row.CFR
      return acc
    },
    {
      totalReports: 0,
      totalSuspected: 0,
      totalConfirmed: 0,
      totalDeaths: 0,
      cfrTotal: 0,
    },
  )

  return {
    ...summary,
    avgCFR:
      summary.totalReports > 0 ? summary.cfrTotal / summary.totalReports : 0,
    positivityRate:
      summary.totalSuspected > 0
        ? (summary.totalConfirmed / summary.totalSuspected) * 100
        : 0,
  }
}

const buildSChVsCCh = (rows) =>
  rows.map((row, idx) => {
    const positivity =
      row.sCh > 0 ? Number(((row.cCh / row.sCh) * 100).toFixed(1)) : 0
    return {
      label: `${row.location} • ${row.reportingDateRaw}`,
      sCh: row.sCh,
      cCh: row.cCh,
      deaths: row.deaths,
      positivity,
      cfr: row.CFR,
      id: row.id ?? idx,
    }
  })

const buildRegionDistribution = (rows) => {
  const regionMap = new Map()

  rows.forEach((row) => {
    const key = row.region && row.region.trim() ? row.region.trim() : 'Unknown'
    if (key === 'Unknown') return
    if (!regionMap.has(key)) {
      regionMap.set(key, { region: key, confirmed: 0 })
    }
    const entry = regionMap.get(key)
    entry.confirmed += row.cCh
  })

  return Array.from(regionMap.values()).sort((a, b) => b.confirmed - a.confirmed)
}

const buildPeriodBuckets = (rows, period = 'month') => {
  const map = new Map()

  rows.forEach((row) => {
    if (!row.reportingDate) return
    const year = row.reportingDate.getFullYear()
    const month = row.reportingDate.getMonth()
    const key = period === 'year' ? `${year}` : `${year}-${month}`
    if (!map.has(key)) {
      const anchor =
        period === 'year'
          ? new Date(year, 0, 1)
          : new Date(year, month, 1)
      map.set(key, {
        sortKey: anchor.valueOf(),
        label:
          period === 'year'
            ? `${year}`
            : anchor.toLocaleString('default', { month: 'short', year: 'numeric' }),
        cfrSum: 0,
        cfrCount: 0,
        suspected: 0,
        confirmed: 0,
      })
    }
    const bucket = map.get(key)
    bucket.cfrSum += row.CFR
    bucket.cfrCount += 1
    bucket.suspected += row.sCh
    bucket.confirmed += row.cCh
  })

  return Array.from(map.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((bucket) => ({
      label: bucket.label,
      sortKey: bucket.sortKey,
      suspected: bucket.suspected,
      confirmed: bucket.confirmed,
      positivity:
        bucket.suspected > 0 ? (bucket.confirmed / bucket.suspected) * 100 : 0,
      cfr: bucket.cfrCount > 0 ? bucket.cfrSum / bucket.cfrCount : 0,
    }))
}

const buildConfirmedPositivitySeries = (rows) => ({
  monthly: buildPeriodBuckets(rows, 'month'),
  yearly: buildPeriodBuckets(rows, 'year'),
})

const buildMonthlySuspectedSeries = (rows) =>
  buildPeriodBuckets(rows, 'month').map((bucket) => ({
    label: bucket.label,
    suspected: bucket.suspected,
    confirmed: bucket.confirmed,
  }))

const buildSeasonalityProfile = (rows) => {
  const months = Array.from({ length: 12 }, (_, index) => ({
    index,
    label: new Date(2000, index, 1).toLocaleString('default', { month: 'short' }),
    sumSuspected: 0,
    sumConfirmed: 0,
    years: new Set(),
  }))

  rows.forEach((row) => {
    if (!row.reportingDate) return
    const idx = row.reportingDate.getMonth()
    const bucket = months[idx]
    bucket.sumSuspected += row.sCh
    bucket.sumConfirmed += row.cCh
    bucket.years.add(row.reportingDate.getFullYear())
  })

  return months.map((bucket) => {
    const divisor = bucket.years.size || 1
    return {
      label: bucket.label,
      avgSuspected: bucket.sumSuspected / divisor,
      avgConfirmed: bucket.sumConfirmed / divisor,
    }
  })
}

const buildCfrTrend = (rows) => ({
  monthly: buildPeriodBuckets(rows, 'month').map((bucket) => ({
    label: bucket.label,
    cfr: bucket.cfr,
  })),
  yearly: buildPeriodBuckets(rows, 'year').map((bucket) => ({
    label: bucket.label,
    cfr: bucket.cfr,
  })),
})

const finalizeBreakdownEntry = (entry) => ({
  label: entry.label,
  suspected: entry.suspected,
  confirmed: entry.confirmed,
  deaths: entry.deaths,
  reports: entry.count,
  avgCFR: entry.count ? entry.cfrSum / entry.count : 0,
  positivity:
    entry.suspected > 0 ? (entry.confirmed / entry.suspected) * 100 : 0,
})

const buildMetricBreakdowns = (rows) => {
  const regionMap = new Map()
  const yearMap = new Map()
  const districtMap = new Map()

  rows.forEach((row) => {
    if (!row.reportingDate) return
    const aggregates = [
      [
        regionMap,
        row.region && row.region.trim() ? row.region.trim() : 'Unknown',
      ],
      [yearMap, `${row.reportingDate.getFullYear()}`],
      [districtMap, row.district || row.location || 'Unknown'],
    ]

    aggregates.forEach(([map, key]) => {
      if (!map.has(key)) {
        map.set(key, {
          label: key,
          suspected: 0,
          confirmed: 0,
          deaths: 0,
          cfrSum: 0,
          count: 0,
        })
      }
      const bucket = map.get(key)
      bucket.suspected += row.sCh
      bucket.confirmed += row.cCh
      bucket.deaths += row.deaths
      bucket.cfrSum += row.CFR
      bucket.count += 1
    })
  })

  const formatList = (map, limit) =>
    Array.from(map.values())
      .map(finalizeBreakdownEntry)
      .sort((a, b) => b.confirmed - a.confirmed)
      .slice(0, typeof limit === 'number' ? limit : undefined)

  return {
    regions: formatList(regionMap),
    years: formatList(yearMap),
    topDistricts: formatList(districtMap, 5),
  }
}

const buildInsights = (rows, regionDistribution, cfrTrend, summary) => {
  if (!rows.length) {
    return ['Select a date range with data to see insights.']
  }

  const regionLeader = regionDistribution[0]
  const monthlyCfr = cfrTrend.monthly ?? []
  const cfrPeak = monthlyCfr.reduce(
    (acc, row) => {
      if (row.cfr > acc.value) {
        return { label: row.label, value: row.cfr }
      }
      return acc
    },
    { label: 'N/A', value: 0 },
  )

  return [
    `Filtered dataset covers ${rows.length.toLocaleString()} situation reports.`,
    regionLeader
      ? `${regionLeader.region} accounts for ${regionLeader.confirmed.toLocaleString()} confirmed cases in this window.`
      : 'No regional data available in this window.',
    cfrPeak.value
      ? `Highest monthly CFR (${cfrPeak.value.toFixed(2)}%) occurred around ${cfrPeak.label}.`
      : 'CFR trend requires more data in this window.',
    summary.totalDeaths
      ? `${summary.totalDeaths.toLocaleString()} deaths reported with an average CFR of ${summary.avgCFR.toFixed(
          2,
        )}%.`
      : 'No reported deaths in this time slice.',
  ]
}

const normalizeDistrictName = (value) =>
  value
    ? value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/ district$/i, '')
    : ''

const buildDistrictAggregates = (rows) => {
  const stats = new Map()
  let maxConfirmed = 0

  rows.forEach((row) => {
    const key = normalizeDistrictName(row.district || row.location)
    if (!key) return

    if (!stats.has(key)) {
      stats.set(key, {
        district: key,
        name: row.district || row.location || key,
        suspected: 0,
        confirmed: 0,
        deaths: 0,
      })
    }
    const entry = stats.get(key)
    entry.suspected += row.sCh
    entry.confirmed += row.cCh
    entry.deaths += row.deaths

    maxConfirmed = Math.max(maxConfirmed, entry.confirmed)
  })

  return {
    districtLookup: Object.fromEntries(
      Array.from(stats.entries()).map(([key, value]) => [key, value]),
    ),
    maxConfirmed,
  }
}

const percentileOf = (values, percentile) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(percentile * (sorted.length - 1))),
  )
  return sorted[index]
}

const averageOfKey = (rows, key) =>
  rows.length
    ? rows.reduce((sum, row) => sum + (row[key] || 0), 0) / rows.length
    : 0

const buildResponseInsights = (rows, breakdowns = null) => {
  const monthly = buildPeriodBuckets(rows, 'month')
  const spreadSeries = monthly.map((entry, idx) => {
    const previous = idx > 0 ? monthly[idx - 1] : null
    const growthRate =
      previous && previous.confirmed
        ? ((entry.confirmed - previous.confirmed) / previous.confirmed) * 100
        : 0
    return {
      ...entry,
      growthRate,
    }
  })

  const confirmedValues = monthly.map((entry) => entry.confirmed).filter(Boolean)
  const outbreakThreshold = percentileOf(confirmedValues, 0.85)
  const outbreakFlags = spreadSeries
    .filter((entry) => entry.confirmed >= outbreakThreshold)
    .map((entry) => ({
      label: entry.label,
      confirmed: entry.confirmed,
      suspected: entry.suspected,
      growthRate: entry.growthRate,
      positivity: entry.positivity,
    }))

  const recentWindow = spreadSeries.slice(-6)
  const responseIndicators = {
    avgPositivity: averageOfKey(recentWindow, 'positivity'),
    avgCFR: averageOfKey(recentWindow, 'cfr'),
    avgGrowth: averageOfKey(recentWindow, 'growthRate'),
  }

  const referenceBreakdowns = breakdowns ?? buildMetricBreakdowns(rows)
  const riskRegions = (referenceBreakdowns.regions || []).map((entry) => ({
    ...entry,
    riskScore: Number(
      (
        (entry.avgCFR || 0) * 0.5 +
        (entry.positivity || 0) * 0.3 +
        (entry.confirmed / (entry.suspected + 1)) * 10
      ).toFixed(2),
    ),
  }))
  const topRiskRegions = riskRegions
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8)

  const vulnerablePopulations = (referenceBreakdowns.topDistricts || [])
    .slice()
    .sort((a, b) => b.deaths - a.deaths)
    .slice(0, 6)

  const transmissionPatterns = spreadSeries.map((entry) => ({
    label: entry.label,
    exposureGap: entry.suspected - entry.confirmed,
    efficiencyRatio:
      entry.suspected > 0 ? entry.confirmed / entry.suspected : 0,
  }))

  return {
    spreadSeries,
    outbreakThreshold,
    outbreakFlags,
    responseIndicators,
    riskRegions: topRiskRegions,
    vulnerablePopulations,
    transmissionPatterns,
  }
}

const buildEarlyWarningInsights = (rows) => {
  const monthly = buildPeriodBuckets(rows, 'month')
  const alertSeries = monthly.map((entry, idx) => {
    const window = monthly.slice(Math.max(0, idx - 2), idx + 1)
    const rollingAverage = averageOfKey(window, 'confirmed')
    const deviation = rollingAverage
      ? ((entry.confirmed - rollingAverage) / rollingAverage) * 100
      : 0
    const isAlert = rollingAverage
      ? entry.confirmed > rollingAverage * 1.25
      : false
    const previous = idx > 0 ? monthly[idx - 1] : null
    const growthRate =
      previous && previous.confirmed
        ? ((entry.confirmed - previous.confirmed) / previous.confirmed) * 100
        : 0
    return {
      ...entry,
      rollingAverage,
      deviation,
      isAlert,
      growthRate,
    }
  })

  const anomalies = alertSeries.filter((entry) => entry.isAlert).slice(-10)

  const lastEntries = alertSeries.slice(-3)
  const avgGrowth = averageOfKey(lastEntries, 'growthRate')
  const latestEntry = lastEntries[lastEntries.length - 1] || null
  const latestConfirmed = latestEntry?.confirmed || 0
  const forecast = Array.from({ length: 3 }).map((_, idx) => {
    const projected =
      latestConfirmed * Math.pow(1 + (avgGrowth || 0) / 100, idx + 1)
    return {
      label: `Forecast +${idx + 1}`,
      confirmed: Math.max(0, Math.round(projected)),
    }
  })

  return {
    alertSeries,
    anomalies,
    forecast,
  }
}

const buildResourcePlanningInsights = (rows, districtStats, breakdowns = null) => {
  const districtEntries = Object.values(districtStats?.districtLookup || {})
  const totals = districtEntries.reduce(
    (acc, entry) => {
      acc.suspected += entry.suspected
      acc.confirmed += entry.confirmed
      acc.deaths += entry.deaths
      return acc
    },
    { suspected: 0, confirmed: 0, deaths: 0 },
  )

  const priorityAreas = districtEntries
    .map((entry) => ({
      label: entry.name || entry.district,
      suspected: entry.suspected,
      confirmed: entry.confirmed,
      deaths: entry.deaths,
      severity: entry.confirmed + entry.deaths * 5,
      share:
        totals.confirmed > 0
          ? (entry.confirmed / totals.confirmed) * 100
          : 0,
    }))
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 10)

  const impactAssessment = {
    totalSuspected: totals.suspected,
    totalConfirmed: totals.confirmed,
    totalDeaths: totals.deaths,
    cfr: totals.confirmed ? (totals.deaths / totals.confirmed) * 100 : 0,
  }

  const referenceBreakdowns = breakdowns ?? buildMetricBreakdowns(rows)
  const resourceSignals = (referenceBreakdowns.regions || [])
    .map((entry) => ({
      label: entry.label,
      pressureScore: entry.confirmed + entry.deaths * 4,
      confirmed: entry.confirmed,
      positivity: entry.positivity,
      avgCFR: entry.avgCFR,
    }))
    .sort((a, b) => b.pressureScore - a.pressureScore)
    .slice(0, 6)

  return {
    priorityAreas,
    impactAssessment,
    resourceSignals,
  }
}

export {
  formatForInput,
  filterByDateRange,
  filterByRegionAndDistrict,
  getUniqueRegionsAndDistricts,
  aggregateSummary,
  buildSChVsCCh,
  buildRegionDistribution,
  buildCfrTrend,
  buildInsights,
  buildDistrictAggregates,
  normalizeDistrictName,
  buildConfirmedPositivitySeries,
  buildMonthlySuspectedSeries,
  buildSeasonalityProfile,
  buildMetricBreakdowns,
  buildResponseInsights,
  buildEarlyWarningInsights,
  buildResourcePlanningInsights,
}


