import { useMemo, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import { motion } from 'framer-motion'
import { normalizeDistrictName } from '../utils/dataTransforms'

const colorScale = (value, max) => {
  if (!max || !value) return 'transparent'
  const intensity = Math.min(1, value / max)
  const start = [255, 241, 242]
  const end = [185, 28, 28]
  const mix = start.map((channel, idx) =>
    Math.round(channel + (end[idx] - channel) * intensity),
  )
  return `rgb(${mix.join(',')})`
}

function CholeraMap({
  geoData,
  districtStats = { districtLookup: {}, maxConfirmed: 0 },
  dateRange,
  geoError,
  dataUpdatedAt,
}) {
  const rangeStart = dateRange?.start || 'earliest record'
  const rangeEnd = dateRange?.end || 'latest record'
  const geoJsonRef = useRef(null)
  const mapDataKey = dataUpdatedAt ? dataUpdatedAt.getTime() : 0

  const styledGeoJson = useMemo(() => {
    if (!geoData) return null
    return {
      ...geoData,
      features: geoData.features.map((feature) => {
        const key = normalizeDistrictName(feature.properties?.name)
        const stats = districtStats.districtLookup[key]
        return {
          ...feature,
          properties: {
            ...feature.properties,
            dashboardStats: stats,
          },
        }
      }),
    }
  }, [geoData, districtStats])

  const handleMouseOver = useCallback((event) => {
    const layer = event.target
    layer.setStyle({
      weight: 2.2,
      color: '#be123c',
      fillOpacity: 1,
    })
    layer.bringToFront()
  }, [])

  const handleMouseOut = useCallback(
    (event) => {
      if (geoJsonRef.current) {
        geoJsonRef.current.resetStyle(event.target)
      }
    },
    [geoJsonRef],
  )

  const handleEachFeature = useCallback(
    (feature, layer) => {
      const stats = feature.properties.dashboardStats
      const content = stats
        ? `<div class="map-popup"><strong>${feature.properties.name}</strong><br />Suspected: ${stats.suspected.toLocaleString()}<br />Confirmed: ${stats.confirmed.toLocaleString()}<br />Deaths: ${stats.deaths.toLocaleString()}</div>`
        : `<div class="map-popup"><strong>${feature.properties.name}</strong><br />No reports in range.</div>`
      layer.bindPopup(content)
      layer.on({
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
      })
    },
    [handleMouseOut, handleMouseOver],
  )

  if (typeof window === 'undefined') return null

  return (
    <motion.section
      className="map-section"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="section-header">
        <h2>Uganda situational overview</h2>
        <p>
          District shading reflects confirmed cases (cCh) between{' '}
          <strong>{rangeStart}</strong> and <strong>{rangeEnd}</strong>. No cases =
          transparent district.
        </p>
      </div>
      <div className="map-legend">
        <span>Low</span>
        <div className="map-legend-bar" />
        <span>High</span>
      </div>
      {geoError && <p className="status-text error">{geoError}</p>}
      {!geoError && styledGeoJson && (
        <MapContainer
          center={[1.3733, 32.2903]}
          zoom={6.3}
          minZoom={6}
          maxZoom={10}
          scrollWheelZoom={false}
          className="uganda-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"
          />
          <GeoJSON
            key={mapDataKey}
            data={styledGeoJson}
            whenCreated={(layer) => {
              geoJsonRef.current = layer
            }}
            style={(feature) => {
              const stats = feature.properties.dashboardStats
              const confirmed = stats ? stats.confirmed : 0
              const fillColor = colorScale(confirmed, districtStats.maxConfirmed)
              return {
                color: confirmed ? 'rgba(248, 113, 113, 0.9)' : '#94a3b8',
                weight: confirmed ? 1.4 : 0.7,
                dashArray: confirmed ? undefined : '3 6',
                fillOpacity: confirmed ? 0.88 : 0,
                fillColor,
              }
            }}
            onEachFeature={handleEachFeature}
          />
        </MapContainer>
      )}
    </motion.section>
  )
}

export default CholeraMap

