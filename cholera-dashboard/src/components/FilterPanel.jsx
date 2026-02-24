import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'

const toInputValue = (date) =>
  date ? date.toISOString().split('T')[0] : ''

const safeDate = (value) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.valueOf()) ? null : parsed
}

const RegionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
const DistrictIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

function FilterPanel({
  dateRange,
  onDateChange,
  dateBounds = {},
  regionOptions = [],
  districtOptions = [],
  selectedRegions = [],
  selectedDistricts = [],
  onRegionChange,
  onDistrictChange,
}) {
  const maxDate = safeDate(dateBounds.max)
  const minDate = safeDate(dateBounds.min)
  const [regionSearch, setRegionSearch] = useState('')
  const [districtSearch, setDistrictSearch] = useState('')

  const filteredRegionOptions = useMemo(() => {
    if (!regionSearch.trim()) return regionOptions
    const q = regionSearch.trim().toLowerCase()
    const matched = regionOptions.filter((r) => r.toLowerCase().includes(q))
    const selected = selectedRegions.filter((r) => !matched.includes(r))
    return [...selected, ...matched]
  }, [regionOptions, regionSearch, selectedRegions])

  const filteredDistrictOptions = useMemo(() => {
    if (!districtSearch.trim()) return districtOptions
    const q = districtSearch.trim().toLowerCase()
    const matched = districtOptions.filter((d) => d.toLowerCase().includes(q))
    const selected = selectedDistricts.filter((d) => !matched.includes(d))
    return [...selected, ...matched]
  }, [districtOptions, districtSearch, selectedDistricts])

  const handlePreset = (preset) => {
    if (!maxDate) return
    let start = new Date(maxDate)
    let end = new Date(maxDate)

    switch (preset) {
      case '30d':
        start.setDate(start.getDate() - 29)
        break
      case '90d':
        start.setDate(start.getDate() - 89)
        break
      case 'ytd':
        start = new Date(maxDate.getFullYear(), 0, 1)
        break
      case 'all':
        if (minDate) start = new Date(minDate)
        if (maxDate) end = new Date(maxDate)
        break
      default:
        break
    }

    onDateChange({
      start: toInputValue(start),
      end: toInputValue(end),
    })
  }

  const clearRegions = () => onRegionChange?.([])
  const clearDistricts = () => onDistrictChange?.([])

  return (
    <motion.section
      className="filter-panel"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="filter-panel__header">
        <p className="eyebrow">Filters</p>
        <h2>Reporting window & location</h2>
        <p className="lede">
          Set date range and optionally narrow by region or district. Charts and
          summaries update automatically.
        </p>
      </div>

      <div className="filter-panel__sections">
        <div className="filter-section filter-section--date">
          <h3 className="filter-section__title">Date range</h3>
          <div className="filter-quick">
            <button type="button" onClick={() => handlePreset('30d')}>
              Last 30 days
            </button>
            <button type="button" onClick={() => handlePreset('90d')}>
              Last 90 days
            </button>
            <button type="button" onClick={() => handlePreset('ytd')}>
              Year to date
            </button>
            <button type="button" onClick={() => handlePreset('all')}>
              All data
            </button>
          </div>
          <div className="filters filters--inline">
            <label>
              Start date
              <input
                type="date"
                value={dateRange.start}
                min={dateBounds.min || undefined}
                max={dateRange.end || dateBounds.max || undefined}
                onChange={(e) =>
                  onDateChange((prev) => ({ ...prev, start: e.target.value }))
                }
              />
            </label>
            <label>
              End date
              <input
                type="date"
                value={dateRange.end}
                min={dateRange.start || dateBounds.min || undefined}
                max={dateBounds.max || undefined}
                onChange={(e) =>
                  onDateChange((prev) => ({ ...prev, end: e.target.value }))
                }
              />
            </label>
          </div>
        </div>

        <div className="filter-section filter-section--location">
          <h3 className="filter-section__title">
            <span className="filter-section__title-icon" aria-hidden="true">
              <RegionIcon />
            </span>
            Location
          </h3>
          <p className="filter-section__location-desc">
            Narrow by region and/or district. Use Ctrl/Cmd + click to select multiple.
          </p>
          <div className="location-filters">
            <div className="location-filter-card">
              <div className="location-filter-card__head">
                <span className="location-filter-card__icon">
                  <RegionIcon />
                </span>
                <span className="location-filter-card__label">Regions</span>
                {selectedRegions.length > 0 && (
                  <button
                    type="button"
                    className="location-filter-card__clear"
                    onClick={clearRegions}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="location-filter-card__badge">
                {selectedRegions.length === 0 ? 'All regions' : `${selectedRegions.length} selected`}
              </div>
              {regionOptions.length > 4 && (
                <input
                  type="search"
                  className="location-filter-card__search"
                  placeholder="Search regions…"
                  value={regionSearch}
                  onChange={(e) => setRegionSearch(e.target.value)}
                  aria-label="Search regions"
                />
              )}
              <select
                multiple
                size={Math.min(5, Math.max(3, filteredRegionOptions.length))}
                className="location-filter-card__select"
                value={selectedRegions}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (opt) => opt.value)
                  onRegionChange?.(selected)
                }}
                aria-label="Filter by region"
              >
                {filteredRegionOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="location-filter-card">
              <div className="location-filter-card__head">
                <span className="location-filter-card__icon">
                  <DistrictIcon />
                </span>
                <span className="location-filter-card__label">Districts</span>
                {selectedDistricts.length > 0 && (
                  <button
                    type="button"
                    className="location-filter-card__clear"
                    onClick={clearDistricts}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="location-filter-card__badge">
                {selectedDistricts.length === 0 ? 'All districts' : `${selectedDistricts.length} selected`}
              </div>
              {districtOptions.length > 8 && (
                <input
                  type="search"
                  className="location-filter-card__search"
                  placeholder="Search districts…"
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  aria-label="Search districts"
                />
              )}
              <select
                multiple
                size={Math.min(5, Math.max(3, filteredDistrictOptions.length))}
                className="location-filter-card__select"
                value={selectedDistricts}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (opt) => opt.value)
                  onDistrictChange?.(selected)
                }}
                aria-label="Filter by district"
              >
                {filteredDistrictOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default FilterPanel
