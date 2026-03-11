import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const numberValue = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseRow = (row, idx) => {
  let reportingDate = null

  if (row.reporting_date) {
    const dateValue = new Date(row.reporting_date)
    if (!Number.isNaN(dateValue.valueOf())) {
      reportingDate = dateValue
    }
  }

  return {
    id: row.id ?? row.index ?? idx,
    location: row.location ?? row.district ?? 'Unknown',
    region:
      row.region && row.region.trim()
        ? row.region.trim()
        : 'Unknown',
    district:
      row.district && row.district.trim()
        ? row.district.trim()
        : '',
    sCh: numberValue(row.sch ?? row.sCh),
    cCh: numberValue(row.cch ?? row.cCh),
    CFR: numberValue(row.cfr ?? row.CFR),
    deaths: numberValue(row.deaths),
    reportingDate,
    reportingDateRaw: row.reporting_date ?? '',
    TL: row.tl ?? row.TL,
    TR: row.tr ?? row.TR,
    source: row.source,
    raw: row,
  }
}

const POLL_INTERVAL_MS = 30_000 // 30s polling

function useCholeraData() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [minDate, setMinDate] = useState(null)
  const [maxDate, setMaxDate] = useState(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  /** 'api' = data went through pipeline; 'supabase' = fallback direct from DB */
  const [dataSource, setDataSource] = useState(null)

  const explicitApiUrl =
    import.meta.env.VITE_XGBOOST_API_URL || import.meta.env.VITE_LSTM_API_URL

  const API_URL =
    explicitApiUrl ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:5001'
      : '')

  const applyParsedRows = (rows) => {
    const parsedRows = rows.map((row, idx) => parseRow(row, idx))
    const validRows = parsedRows.filter((row) => row.reportingDate)
    if (!validRows.length) return false
    const timestamps = validRows.map((row) => row.reportingDate.valueOf())
    setMinDate(new Date(Math.min(...timestamps)))
    setMaxDate(new Date(Math.max(...timestamps)))
    setData(validRows)
    setError('')
    setLastUpdatedAt(new Date())
    return true
  }

  const fetchFromSupabase = async () => {
    if (!isSupabaseConfigured || !supabase) return null
    const { data: rows, error: supaError } = await supabase
      .from('cholera_reports')
      .select(
        'id,index,location,tl,tr,deaths,sch,cch,cfr,reporting_date,source_index,source,confidence_weight,processing_notes,source_database,district,region',
      )
    if (supaError || !rows || rows.length === 0) return null
    return rows
  }

  const fetchData = async () => {
    // 1) Try pipeline API first
    if (API_URL) {
      try {
        const response = await fetch(`${API_URL}/api/cholera-data`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        if (response.ok) {
          const payload = await response.json()
          const rows = payload.data || []
          if (rows.length > 0 && applyParsedRows(rows)) {
            setDataSource('api')
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn('Cholera data API unreachable, trying Supabase:', err.message)
      }
    }

    // 2) Fallback: load directly from Supabase so the app still works
    if (isSupabaseConfigured && supabase) {
      try {
        const rows = await fetchFromSupabase()
        if (rows && applyParsedRows(rows)) {
          setDataSource('supabase')
          setError('') // Data loaded; use dataSource for optional notice
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Supabase fallback failed:', err)
      }
    }

    if (!API_URL) {
      setError(
        'Cholera data API is not configured. Set VITE_XGBOOST_API_URL to your backend URL, or ensure Supabase is configured.',
      )
    } else if (!isSupabaseConfigured || !supabase) {
      setError(
        'Could not reach the data API and Supabase is not configured. Start the backend (cd cholera-dashboard/api && python rf_predict.py) with SUPABASE_URL and SUPABASE_ANON_KEY set.',
      )
    } else {
      setError(
        'Failed to load data from the API and from Supabase. Check that the backend is running and Supabase credentials are valid.',
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Polling: refresh regularly so new rows appear
  useEffect(() => {
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return {
    data,
    loading,
    error,
    minDate,
    maxDate,
    lastUpdatedAt,
    dataSource, // 'api' | 'supabase' | null
    refetch: fetchData,
  }
}

export default useCholeraData


